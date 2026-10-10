// dynamic-help-system.js - Context-aware help system for tournament manager

/**
 * HELP CONTENT DATABASE
 * Organized by page and context with progressive disclosure
 */
const HELP_CONTENT = {
    // Setup Page Help
    setup: {
        title: "Tournament Setup",
        overview: "Start a tournament, or pick one up where you left off. The tournament you're running is at the top, with its next step; starting a new one is a quiet line under it. The panel to act on is framed: the tournament while it is New or Active; once it is completed, the New tournament form moves to the top, open and framed, with Create tournament as the main button (the same when nothing is loaded).",
        sections: {
            current: {
                title: "Current Tournament",
                content: `
                    <p>The loaded tournament, with its status (<strong>New</strong>, <strong>Active</strong> or <strong>Completed</strong>; grey, orange or green) and a short fact beside it: that the bracket isn't drawn, how many matches are completed, or who won. Under the name: players, bracket size, and the matches being played now.</p>
                    <p><strong>Next step</strong> changes with the status:</p>
                    <ul>
                        <li><strong>New:</strong> Register players, then draw the bracket from the bracket page</li>
                        <li><strong>Active:</strong> Open bracket</li>
                        <li><strong>Completed:</strong> Open in Analytics (or Add to Analytics, if it isn't there yet)</li>
                    </ul>
                    <p><strong>Export tournament:</strong> Save the tournament as a JSON file, for backup or to move it to another computer.</p>
                    <p><strong>Backup to server:</strong> Shown when the Tournament Manager runs on a server. Uploads the tournament, or a tournament file.</p>
                    <p><strong>Reset tournament:</strong> Clears all bracket progress and keeps the players. You type the tournament's name to confirm. Not offered once a tournament is completed: its results are final (to correct one, Developer Console → Toggle Read-Only, then undo the match).</p>
                    <p><strong>⚠️ Warning:</strong> Reset permanently deletes all match results and standings.</p>
                `
            },
            creation: {
                title: "New Tournament",
                content: `
                    <p>Click <strong>+ New tournament</strong> to open the form. Once the tournament is completed (or when nothing is loaded), the form is always open at the top, under <strong>Start a new tournament</strong>.</p>
                    <ol>
                        <li>Enter a name (e.g., "Thursday Cup #42")</li>
                        <li>Check the date (defaults to today)</li>
                        <li>Click <strong>Create tournament</strong>. It becomes the current tournament at the top, and its next step is <strong>Register players</strong></li>
                    </ol>
                    <p><strong>Import a tournament file:</strong> Load a tournament from an exported JSON file. It is next to <strong>+ New tournament</strong>.</p>
                `
            },
            recent: {
                title: "Tournaments",
                content: `
                    <p>Every tournament on this computer, newest first, with date, players, status and Analytics.</p>
                    <ul>
                        <li><strong>Load:</strong> Switch to that tournament</li>
                        <li><strong>×:</strong> Delete it permanently (asks first)</li>
                        <li><strong>Loaded:</strong> Marks the current tournament, which can't be deleted</li>
                        <li><strong>Analytics:</strong> <strong>View</strong> opens it in Analytics; <strong>+ Add</strong> adds a completed tournament that isn't there yet</li>
                    </ul>
                    <p><strong>Server:</strong> When the Tournament Manager runs on a server, a <strong>Server</strong> tab lists the tournaments shared there, with <strong>Import</strong> (or <strong>Re-import</strong> if it's already on this computer).</p>
                    <p><strong>Storage:</strong> How full this computer's browser storage is. Click it for details.</p>
                `
            },
            results: {
                title: "Match History",
                content: `
                    <p>The current tournament's completed matches, latest first.</p>
                    <ul>
                        <li>The winner in green, then the score</li>
                        <li>Lane, referee, and where both players went: the next match, or their final placing</li>
                        <li>Click a match to see its details. Walkovers are greyed out</li>
                    </ul>
                `
            }
        }
    },

    // Registration Page Help
    registration: {
        title: "Player Registration",
        overview: "Pick tonight's players from the club's player database and mark who has paid. Once the bracket is drawn, the page shows the Leaderboard.",
        sections: {
            adding: {
                title: "Adding Players",
                content: `
                    <ol>
                        <li>Type in <strong>Add from the database</strong>: it searches short, first, last and previous names</li>
                        <li>Click a player, or press Enter to add the first match</li>
                        <li>Not in the database yet? <strong>+ New player</strong> (or Enter when no one matches) creates them and adds them</li>
                        <li>Click a player in <strong>Players</strong> to switch between <strong>Paid</strong> and <strong>Unpaid</strong>; <strong>×</strong> removes an unpaid player</li>
                    </ol>
                    <p><strong>Next step</strong> shows the player, paid and unpaid counts, and what's needed before the draw. <strong>Open bracket</strong> works once there are at least 4 paid players. Only paid players go into the bracket.</p>
                    <p><strong>Payment QR code:</strong> Add <code>payment.png</code> to the <code>images/</code> folder (Swish, bank details, etc.) and it is shown next to the players. Without it, the panel is hidden.</p>
                `
            },
            database: {
                title: "The Player Database",
                content: `
                    <p>Every player has a permanent ID, a <strong>short name</strong> (what the bracket, Match Controls, the Chalker and the Leaderboard show; it must be unique) and a first and last name. Analytics follows the ID, so a player's results stay together whatever they are called.</p>
                    <ul>
                        <li><strong>Edit:</strong> change the names. A changed short name is kept under <em>Previous names</em>, so older results under it still count for the player.</li>
                        <li><strong>Merge…:</strong> for duplicates (“Erik” and “Eirik”). Choose whose details to keep; the other's tournaments and Analytics become theirs. This can't be undone. Two players who played in the same tournament are two people, so they can't be merged.</li>
                        <li><strong>Archive:</strong> hides a player from the list for new tournaments. Players who have played are kept for Analytics, so they can be archived but not deleted. Players who never played can be deleted.</li>
                        <li><strong>Import from file:</strong> adds the players from a tournament export file. It never replaces the database.</li>
                    </ul>
                    <p>The database is kept on this computer and travels with every tournament export and upload, so a shared Analytics instance shows the current names.</p>
                `
            },
            statistics: {
                title: "Player Statistics",
                content: `
                    <p>Once the bracket is drawn, click a player in the <strong>Leaderboard</strong> to record or correct:</p>
                    <ul>
                        <li><strong>Short Legs:</strong> Legs finished within the dart count set by Short Leg Threshold on the Config page (default 21)</li>
                        <li><strong>High Outs:</strong> Finishing scores of 101+ points</li>
                        <li><strong>180s:</strong> Maximum dart scores</li>
                        <li><strong>Tons:</strong> Any score of 100+ points</li>
                    </ul>
                    <p>Statistics count towards the points.</p>
                    <p><strong>Player arrived late?</strong> Under the player list once the bracket is drawn. It explains how to register a late arrival from the Developer Console.</p>
                `
            },
            results: {
                title: "Leaderboard",
                content: `
                    <ul>
                        <li><strong>Rank:</strong> Tournament placement (1st, 2nd, 3rd, etc.)</li>
                        <li><strong>Points:</strong> Placement plus achievements, using the points in Global Settings</li>
                        <li><strong>Legs Won/Lost:</strong> From completed matches</li>
                    </ul>
                    <p><strong>Export CSV:</strong> The Leaderboard as a spreadsheet, for records or league management.</p>
                    <p><strong>Export JSON:</strong> Results and match history, for importing into other systems.</p>
                    <p>Rankings update as matches are completed.</p>
                `
            }
        }
    },

    // Tournament Page Help
    tournament: {
        title: "Tournament Management",
        overview: "Run the tournament bracket, manage matches, and track live progress.",
        sections: {
            bracket: {
                title: "Tournament Setup & Bracket Generation",
                content: `
                    <p><strong>Setting Up Your Tournament:</strong></p>
                    <ol>
                        <li>Open the <strong>Match Controls</strong> tab in the header</li>
                        <li>Before the draw it shows the players: click a name to mark them paid or unpaid, click <strong>×</strong> on an unpaid player to remove them, or add a player (found in the player database, or created). Everyone must be paid before the draw: the draw buttons say how many are still unpaid</li>
                        <li>If seeding is on (Global Settings → Tournaments → Seeding), tick <strong>Seed the draw by ranking</strong> to keep the best players apart. The panel shows which earlier tournaments the ranking comes from, and who would be seeded</li>
                        <li>When ready, pick a format under <strong>Pick a format</strong> (each card says what it means for tonight's players; the picked one shows how it works, roughly how many matches, and its options), then click <strong>Draw</strong>. It opens on the format of your last tournament</li>
                    </ol>
                    <p><strong>Tournament Formats:</strong></p>
                    <ul>
                        <li><strong>Single Elimination Cup:</strong> One loss and you're out — 4 to 48 players</li>
                        <li><strong>Double Elimination Cup:</strong> Losers get a second chance through the backside — 4 to 48 players</li>
                        <li><strong>Round Robin:</strong> everybody plays everybody — in groups (up to four players, or five or six as set) followed by an A cup and a B cup (6 to 32 players), or in one group where the table decides (3 to 8 players), as set in Global Settings → Round Robin (see <strong>Round Robin</strong> below)</li>
                    </ul>
                    <p><strong>Bracket Sizes:</strong></p>
                    <ul>
                        <li>4 players → 4-player bracket (SE only)</li>
                        <li>5-8 players → 8-player bracket</li>
                        <li>9-16 players → 16-player bracket</li>
                        <li>17-32 players → 32-player bracket</li>
                        <li>33-48 players → 32-player bracket with qualifiers first (see <strong>Qualifiers</strong> below)</li>
                    </ul>
                    <p><strong>Qualifiers (33 to 48 players):</strong> the players above 32 make it in through qualifier matches (Q1, Q2 …) before round 1, one for each player above 32: 40 players play 8 qualifiers, 48 play 16. The players in them are drawn at random (with seeding, never the seeds; with <strong>All</strong>, the lowest-ranked), and each winner takes the place in round 1 that shows "Winner Q3". A qualifier only decides who gets to play: the loser is not qualified (placed 33rd–48th), and nothing in a qualifier counts, for the winner either (no achievements, no matches or legs in the statistics, never in Analytics). Its length is the format's regular rounds. Double elimination with qualifiers is drawn with the finals in the middle.</p>
                    <p><strong>Cup and Plate:</strong> pick the Cup and Plate card before you draw (from 5 players). The bracket is then the Cup, and every round 1 loser goes on to the Plate, a second knockout of half the size, at a fixed place: the losers of round 1 match 1 and 2 meet in the Plate's first match, and so on, so a Plate match can start as soon as its two round 1 matches are played. A bye's place in the Plate is a walkover. The Plate is drawn back to back with the Cup, the two finals facing each other. Its places follow the shared places (with 8 players the Plate's finalists are 5th–6th, its bronze pair 7th–8th), and the finished view names the Plate winner. Match lengths and bronze finals as single elimination.</p>
                    <p><strong>💡 Tip:</strong> Match Controls adapts based on tournament state - use it for both setup and active tournament management!</p>
                `
            },
            navigation: {
                title: "Bracket Navigation & Quick Access",
                content: `
                    <p><strong>Header:</strong></p>
                    <ul>
                        <li><strong>Left:</strong> tournament name and date, and links to <strong>Setup</strong>, <strong>Registration</strong>, <strong>Config</strong> and <strong>Analytics</strong></li>
                        <li><strong>Centre:</strong> the tabs <strong>Bracket | Match Controls</strong> (plus <strong>Console</strong> when the Developer Console is enabled in Config), and <strong>Leaderboard</strong>. The left and right arrow keys switch between Bracket and Match Controls</li>
                        <li><strong>Right:</strong> <strong>Finals Right | Middle</strong> (<strong>Groups | Cups</strong> in a Round Robin tournament with groups and cups), <strong>Fit all</strong>, zoom (− / +) and the clock. On Match Controls and the Console only the clock shows</li>
                        <li><strong>Status line:</strong> players, matches played, walkovers, live and ready, with the colour legend on the bracket</li>
                    </ul>
                    <p><strong>Moving around:</strong></p>
                    <ul>
                        <li><strong>Pan:</strong> drag the bracket</li>
                        <li><strong>Zoom:</strong> scroll or pinch, at the pointer. <strong>Fit all</strong> shows the whole bracket, and is as far out as you can go</li>
                        <li><strong>Hover a match:</strong> zoomed out, it is magnified; zoomed in, a tip shows where the winner and loser go</li>
                    </ul>
                    <p><strong>Selecting a match:</strong></p>
                    <ul>
                        <li><strong>Click a match</strong> to highlight its lines and the matches it is connected to. The view follows if they are off-screen; markers at the edge point to the rest</li>
                        <li><strong>Follow [player]</strong> traces that player through the bracket. Click it again to stop</li>
                        <li><strong>Undo match</strong> appears when the result can be undone</li>
                        <li><strong>Match Controls</strong> switches to Match Controls and points out that match</li>
                        <li>Click empty space or press <strong>Esc</strong> to clear the selection</li>
                    </ul>
                    <p><strong>Finals Right | Middle:</strong> the finals at the right edge, or in the middle: between the frontside and backside in double elimination; in single elimination, the two halves of the bracket face a final in the middle, with the bronze final under it. Also in Global Settings → Bracket.</p>
                `
            },
            matches: {
                title: "Match Management",
                content: `
                    <p><strong>Match Colours:</strong></p>
                    <ul>
                        <li><strong>Dashed grey (Waiting):</strong> players not decided yet; empty slots say where they come from</li>
                        <li><strong>Yellow (Ready):</strong> both players known, can start</li>
                        <li><strong>Orange (Live):</strong> being played</li>
                        <li><strong>Green (Completed):</strong> winner highlighted, with the leg score when entered</li>
                        <li><strong>Faded (Walkover):</strong> advanced automatically</li>
                        <li><strong>Orange dot:</strong> throws first</li>
                    </ul>
                    <p><strong>Running Matches:</strong> matches are run from <strong>Match Controls</strong>: start, lane, referee, winner and Chalker handover. The bracket shows where things stand.</p>
                    <p><strong>Chalker QR:</strong> click <strong>QR</strong> on a LIVE match in Match Controls. The Chalker scans it to receive player names, format, and lane/referee automatically.</p>
                `
            },
            completion: {
                title: "Completing & Correcting Matches",
                content: `
            <p><strong>Selecting Winners:</strong></p>
            <ol>
                <li>In Match Controls, click the winner's name (<strong>Wins</strong>) on the match's lane tile</li>
                <li>Enter leg scores (optional but recommended)</li>
                <li>Click "<strong>Confirm Winner</strong>"</li>
            </ol>
            <p><strong>Scan Results QR:</strong> If the match was scored on the Chalker, click <strong>Scan Results QR</strong> in the confirmation dialog to import the result and player achievements directly from the Chalker's QR code — no manual entry needed.</p>
            <p><strong>Correcting Match Results:</strong></p>
            <ul>
                <li><strong>Select the match</strong> in the bracket and click <strong>Undo match</strong></li>
                <li><strong>Only safe matches can be undone</strong> - none of the matches it feeds may be live or played</li>
                <li><strong>Multi-step correction:</strong> undo several matches by working backwards through the bracket</li>
            </ul>
            <p><strong>💡 Tip:</strong> Undo match only appears when it is safe to use.</p>
            `
            },
            lanes: {
                title: "Lane/Referee Management",
                content: `
                    <p><strong>Assigning Lanes/Referees:</strong></p>
                    <ul>
                        <li>Use the <strong>Lane</strong> and <strong>Referee</strong> dropdowns on each match in Match Controls</li>
                        <li>System prevents multiple matches with same lane/referee</li>
                        <li>Players in LIVE matches cannot be selected as referees</li>
                        <li>Players in LIVE matches may be selected as referees in their own match</li>
                        <li>Completed matches will release their assigned lanes/referees</li>
                        <li>Lane/referee history is retained for completed matches</li>
                        <li>Configure max lanes in Config page</li>
                    </ul>
                    <p><strong>In the bracket:</strong> a live match shows its lane (L1, L2 …); hover it to see the referee.</p>
                    <p><strong>QR Integration:</strong> When a lane or referee is assigned, it is automatically included in the Chalker assignment QR code. The Chalker displays the lane in its info bar and the referee name throughout the match.</p>
                    <p><strong>💡 Tip:</strong> Assign lanes to organize physical dartboard usage and avoid conflicts.</p>
                `
            },
            groups: {
                title: "Round Robin",
                content: `
                    <p><strong>Two ways to play</strong> (Global Settings → Round Robin): <strong>Groups and cups</strong> or <strong>One group</strong>. A tournament keeps the setting it was drawn with.</p>
                    <p><strong>One group:</strong> everybody plays everybody in a fixed order, each match with a planned referee from the group; the table decides the placings when the last match is played. 3 to 8 players.</p>
                    <p><strong>Groups and cups:</strong> players are drawn into groups of up to four, or five or six as set in <strong>Largest group</strong> (an even number of groups; by ranking when seeding is ticked, otherwise at random). Everybody plays everybody in their group. Then the <strong>A cup</strong> and the <strong>B cup</strong>: single elimination with a bronze final, drawn with the final in the middle. <strong>To the A cup</strong>: <strong>Top half</strong> (the default): everyone ranked across the groups and split into two cups of the same size, or the top two of each group (the rest play the B cup).</p>
                    <p><strong>The group stage:</strong></p>
                    <ul>
                        <li>Each group plays in a fixed order, and each match has a planned referee from the group. Match Controls shows each group's next matches with the referee filled in; it is set when the match starts, if that player is free. Change it like any referee</li>
                        <li>A player can't start a match while they are playing another one</li>
                        <li>The group table: wins, then leg difference, then legs won, then head-to-head. Players still level when the group has played every match are marked <strong>level</strong>; the group seed decides unless you click <strong>▲</strong> in Match Controls' group tables before drawing the cups</li>
                        <li><strong>Groups</strong> on the bracket page shows every group's table and matches. Click a match that hasn't been played to open it in Match Controls; a played one has <strong>Undo</strong> while it can be undone</li>
                    </ul>
                    <p><strong>Draw the cups:</strong> when the last group match is played, Match Controls shows both cups' seeded fields: group winners first, then runners-up, and so on, ranked across the groups by win rate, then leg difference per match (with Top half the A cup takes the first half of that order; with top two, the B cup has the thirds, then the fourths, and so on). Switch off <strong>Play the B cup</strong> to play without it (whether it starts on is a Global Setting); then the A cup takes the top two of each group, also with Top half, and the rest are placed after it by their group results. Nothing is drawn until you click <strong>Draw the cups</strong>.</p>
                    <p><strong>The cups:</strong> A cup and B cup side by side in Match Controls, on the same lanes. Round 1's referees are planned (players with a bye, then the players from the bottom of the round, then the first losers), later rounds take losers as they come. <strong>Cups</strong> on the bracket page shows both.</p>
                    <p><strong>Undo:</strong> group results can be undone until the cups are drawn. <strong>Undo the cup draw</strong> (Match Controls) is there until a cup match has been started or played; it opens the group stage again. Cup matches undo as in any bracket.</p>
                    <p><strong>Placings:</strong> everyone is placed. A cup: 1st and 2nd from the final, 3rd and 4th from the bronze final. B cup: its final pair 5th–6th, its bronze pair 7th–8th. Then the A cup's other losers (the latest round first), then the B cup's, each round ordered by group results, then anyone who played no cup. Places run on as shared places (9th–12th, 13th–16th …), so places a small B cup can't fill go to the A cup's quarterfinal losers; without a B cup they take 5th–8th. Everyone gets the points for taking part.</p>
                    <p><strong>Waits:</strong> a match waits (Match Controls says why) while one of its players is the referee of an earlier match in the group or cup, or while its planned referee isn't known yet (the loser of a match still to be played). Choose another referee to start it anyway. A referee chosen for a match that hasn't started is only a plan: it blocks no one until that match is live.</p>
                    <p><strong>Match length:</strong> group matches and the cups have their own settings (Global Settings → Match length → Groups and cups): <strong>Cup rounds</strong> (every round before the semifinals), <strong>Cup semifinal</strong>, <strong>Cup bronze final</strong> and <strong>Cup final</strong>, the same for the A and the B cup.</p>
                `
            },
            matchControls: {
                title: "Match Controls Interface",
                content: `
                    <p><strong>Accessing Match Controls:</strong></p>
                    <ul>
                        <li>The <strong>Match Controls</strong> tab in the header, or <strong>Match Controls</strong> in the selection bar after clicking a match</li>
                        <li>The page starts on Match Controls; turn off <strong>Start on Match Controls</strong> in Config to start on the bracket</li>
                        <li>Switching tabs keeps the bracket where you left it</li>
                        <li>The one place where matches are run</li>
                    </ul>
                    <p><strong>While the tournament runs:</strong></p>
                    <ul>
                        <li><strong>Lanes:</strong> one tile per live match, by lane: the players as <strong>Wins</strong> buttons, how long the match has been on the board, its lane and referee (both can be changed while it is live), the handover (<strong>QR</strong>, <strong>Transfer</strong>, or the green <strong>Result ✓</strong> when a Chalker has sent one back) and <strong>Stop</strong>. A live match without a lane gets a <em>No lane</em> tile.</li>
                        <li><strong>Free:</strong> the free lanes on one line, with the next ready match. Click a free lane to start that match there.</li>
                        <li><strong>Ready to start:</strong> the matches that can start, by round (frontside and backside side by side), each with Lane, Referee and <strong>Start</strong>. A player who is refereeing another match is marked, and Start waits until that is sorted.</li>
                        <li><strong>Referees:</strong> live matches without a referee first, then recent losers, recent winners and who refereed recently. Players in live matches aren't suggested.</li>
                        <li><strong>Scan QR results</strong> is in the Lanes heading while matches are live (QR handover).</li>
                    </ul>
                    <p><strong>When the tournament is finished:</strong> the podium with Most 180s, Shortest leg and Highest out under it, and a plaque with the club, tournament and date; then 4th, 5th–6th and 7th–8th (the places that still score placement points) and the night's awards, one per row (Most points, Most matches won, Backside run, Best average, Most tons, Lollipops, Busiest lane), the night in numbers, and Tournament Analytics.</p>
                    <p><strong>Real-time Updates:</strong> Interface refreshes automatically after each action.</p>
                `
            }
        }
    },

    // Config Page Help
    config: {
        title: "Global Settings",
        overview: "Settings for this computer, used by every tournament. Change what you need, then click <strong>Save changes</strong> in the bar at the bottom. On a shared Analytics instance the page is called <strong>Custom Settings</strong> and shows the Points only: members try other point values there, kept in their own browser, and see them in Analytics with <strong>Custom</strong>.",
        sections: {
            application: {
                title: "Saving and the Page Layout",
                content: `
                    <p><strong>Sections:</strong> <strong>Club</strong>, <strong>Tournaments</strong>, <strong>Match day</strong>, <strong>Bracket</strong>, <strong>Chalker</strong>, <strong>Server &amp; backup</strong> and <strong>Developer</strong>. Click a name in the list on the left to jump to it.</p>
                    <p><strong>Saving:</strong></p>
                    <ul>
                        <li>Any change brings up a bar at the bottom: <strong>Discard</strong> or <strong>Save changes</strong>. Nothing is saved until you click Save changes.</li>
                        <li>An orange dot in the section list marks each section with unsaved changes.</li>
                        <li>Leaving the page with unsaved changes asks first: <strong>Stay</strong>, <strong>Discard and continue</strong> or <strong>Save and continue</strong>.</li>
                    </ul>
                    <p><strong>Club:</strong> the club name is shown in the page title and at the top of the bracket. For a logo, put a square <code>logo.png</code>, <code>logo.jpg</code>, <code>logo.jpeg</code> or <code>logo.svg</code> in the <code>images</code> folder.</p>
                    <p><strong>Match day:</strong></p>
                    <ul>
                        <li><strong>Lanes:</strong> how many dartboards you have. Under <strong>Lanes not in use</strong>, click a lane to leave it out of lane assignment.</li>
                        <li><strong>Confirm the winner:</strong> ask for the score and statistics when a winner is chosen. When off, matches complete at once with nothing entered.</li>
                        <li><strong>Start on Match Controls</strong>, <strong>New players are paid</strong>, <strong>Referee suggestions</strong>.</li>
                    </ul>
                    <p><strong>Bracket:</strong> <strong>Finals position</strong>, Right or Middle (double elimination). The same setting as the Finals toggle in the bracket header.</p>
                    <p><strong>Developer:</strong> <strong>Developer Console</strong> adds a <strong>Console</strong> tab to the Tournament Bracket page, with diagnostics, validation checks, lane usage and transaction tools.</p>
                `
            },
            roundRobin: {
                title: "Round Robin",
                content: `
                    <p><strong>Round Robin</strong> (Tournaments) shows while the format is ticked under Formats to offer.</p>
                    <ul>
                        <li><strong>Structure:</strong> <strong>Groups and cups</strong> (groups, then an A cup and a B cup; 6 to 32 players) or <strong>One group</strong> (everybody plays everybody, the table decides; 3 to 8 players)</li>
                        <li><strong>Play each other</strong> (one group): <strong>Once</strong> (the default) or <strong>Twice</strong>, a double round robin: when everybody has played everybody once, the return round follows in the same order with the players swapped; both meetings count in the table. It can also be chosen at the draw</li>
                        <li><strong>Largest group:</strong> <strong>4</strong> (the default), <strong>5</strong> or <strong>6</strong>. The draw makes the fewest groups it can, always an even number, so a larger limit means fewer, longer groups (a group of 4 plays 6 matches, of 5 plays 10, of 6 plays 15)</li>
                        <li><strong>To the A cup:</strong> <strong>Top two</strong> of each group, or <strong>Top half</strong>: everyone ranked across the groups and split into two cups of the same size, so a small field doesn't leave a tiny B cup. Without a B cup, the A cup always takes the top two of each group</li>
                        <li><strong>Group rematches in cup round 1:</strong> <strong>Allow</strong> (top seed against bottom seed, as drawn) or <strong>Avoid</strong> (a seed gets the nearest opponent from another group, where possible)</li>
                        <li><strong>Play the B cup:</strong> whether the switch at Draw the cups starts on</li>
                    </ul>
                    <p>A tournament keeps the settings it was drawn with; a change here applies to the next draw.</p>
                `
            },
            seeding: {
                title: "Seeding",
                content: `
                    <p><strong>Seeding</strong> (Tournaments) lets the draw keep the best players apart, in every format. <strong>Off</strong>: the draw is always random. <strong>Available</strong>: the option is offered, and you tick it. <strong>On</strong>: it is ticked to start with.</p>
                    <p><strong>Seeded players</strong> is how many of the best players are seeded, as a share of the bracket: 1/8, 1/4 or 1/2 (2, 4 or 8 players in a 16-player bracket). <strong>All</strong> seeds everyone with a ranking, so the top seed meets the bottom seed. Seeded players can't meet in round 1, and everyone else is drawn at random. You can change it for each draw.</p>
                    <p><strong>Byes</strong> go to the best seeds. Players with no ranking are never seeded, and only get a bye if there are more byes than seeds.</p>
                    <p><strong>Round Robin</strong> seeds every ranked player into the groups in snake order (the best in group A, the second in B, …, then back again), or into the one group's order; Seeded players doesn't apply. The cups are seeded from the group tables.</p>
                    <p><strong>The ranking</strong> is the Leaderboard's points over earlier tournaments with the same name, from this browser. The name word is taken from the tournament's name ("Måndagscup", "Måndagscup week 43" and "NewTon Måndagscup" are the same cup), and tournaments with "Final" in the name never count. It looks at the current half-year, or the previous one for the first match of a season. In Match Controls you can change the word or the period, and tick tournaments by hand.</p>
                    <p><strong>💡 New players</strong> are never seeded; Match Controls names them. With no earlier tournaments in this browser, or none ticked, the draw is random. To seed from the club's history, restore a backup on this computer first.</p>
                `
            },
            formats: {
                title: "Tournament Formats",
                content: `
                    <p><strong>Formats to offer</strong> (Tournaments) controls which formats can be picked in Match Controls' <strong>Pick a format</strong> when starting a tournament. A format not offered is still shown there, greyed out. Cup and Plate is one of them.</p>
                    <p>Untick the ones your club never plays so they can't be picked by mistake. At least one format always stays available.</p>
                    <p><strong>💡 Existing tournaments are unaffected:</strong> a tournament already created in a hidden format still opens, renders and exports as normal.</p>
                `
            },
            matches: {
                title: "Match Length",
                content: `
                    <p><strong>Match length</strong> (Tournaments) sets best-of legs per round, with − and + (Bo1 to Bo21).</p>
                    <ul>
                        <li><strong>Double elimination:</strong> regular rounds, frontside and backside semifinal, backside final, grand final</li>
                        <li><strong>Single elimination:</strong> regular rounds, quarterfinal, semifinal, bronze final, final</li>
                        <li><strong>Groups and cups:</strong> group matches; cup rounds (every round before the semifinals), cup semifinal, cup bronze final, cup final, the same for the A and the B cup. The cups' lengths are taken when the cups are drawn</li>
                    </ul>
                    <p><strong>Reset to defaults</strong> fills in the standard lengths; click Save changes to keep them. New lengths apply to matches that haven't started.</p>
                `
            },
            points: {
                title: "Points",
                content: `
                    <p><strong>Points</strong> (Tournaments):</p>
                    <ul>
                        <li><strong>Placing:</strong> points for taking part, and for each final placing</li>
                        <li><strong>Also for qualifier losers</strong> (under Taking part): whether a player who loses a qualifier (33 to 48 players) gets the Taking part points too. On by default; it applies to earlier tournaments too in Analytics' Custom point mode</li>
                        <li><strong>Achievements, each:</strong> 180s, high outs (101+), short legs and tons (100+)</li>
                    </ul>
                    <p><strong>Reset to defaults</strong> fills in the standard values; click Save changes to keep them.</p>
                `
            },
            handover: {
                title: "Chalker Settings",
                content: `
                    <p><strong>Chalker</strong> settings are sent to the Chalker when a match starts:</p>
                    <ul>
                        <li><strong>Game:</strong> 301, 501, 701, or <strong>Other</strong> for a starting score of your own (2–1001; unusual scores make larger QR codes)</li>
                        <li><strong>Most rounds per leg</strong> and <strong>Short leg</strong> (darts)</li>
                    </ul>
                    <p><strong>Handover</strong>, how a match reaches the Chalker:</p>
                    <ul>
                        <li><strong>QR code:</strong> show a code on the match for the Chalker to scan, and scan its result code back. Works offline.</li>
                        <li><strong>Network</strong> (experimental): send the match to a Chalker on the same local network; the result comes back on its own and is counted on the <strong>Match Controls</strong> tab until you accept it. Needs the Docker image, with the Chalker opened from your own server.</li>
                        <li><strong>None</strong> (default): results are entered by hand.</li>
                    </ul>
                `
            },
            server: {
                title: "Server & Backup",
                content: `
                    <p><strong>Only when running the Docker image.</strong> These settings do nothing if you opened the app as a file.</p>
                    <ul>
                        <li><strong>Back up finished tournaments:</strong> upload a tournament to the server when it finishes. This fills Shared Tournaments, and lets a separate Analytics instance collect a season's results.</li>
                        <li><strong>Allow deleting tournaments:</strong> off by default. Shows delete buttons for shared tournaments and in the Analytics register.</li>
                        <li><strong>Remote backup:</strong> optional second destination: its address, and its API key if that server has one (<code>NEWTON_API_KEY</code>). <strong>Test connection</strong> checks both before you rely on them: whether the server answers, and whether it accepts the key. It sends nothing to keep. Once the key is accepted, the address and key are <strong>locked</strong> so nobody changes them by accident; <strong>Change…</strong> unlocks them again (the key is cleared, so test the new one).</li>
                    </ul>
                    <p><strong>💡 If Shared Tournaments stays empty</strong> on a Linux server, the container could not write to its tournament folder. Its startup log says so and gives the command to fix it.</p>
                `
            }
        }
    },

    // Analytics Page Help
    history: {
        title: "Analytics",
        overview: "Explore your tournament history — standings across a season, player records, and every completed match. Analytics only ever reads your results; it never changes them.",
        sections: {
            views: {
                title: "The Four Views",
                content: `
                    <p>Buttons along the top switch between them. All four show the same set of tournaments &mdash; whichever ones the <strong>Lens</strong> currently selects.</p>
                    <ul>
                        <li><strong>Dashboard</strong> &mdash; the headline numbers: tournaments, matches, unique players, total points, 180s, the highest checkout and the shortest leg. Click a card to jump to the view behind it. Under them, the Leaderboard's top 10 and the latest tournaments.</li>
                        <li><strong>Leaderboard</strong> &mdash; the standings. One row per player, sortable by any column.</li>
                        <li><strong>Players</strong> &mdash; the player list; tick one to see their profile, or several to compare them.</li>
                        <li><strong>Register</strong> &mdash; the underlying records: every tournament, and every match within them.</li>
                    </ul>
                `
            },
            lens: {
                title: "The Lens — Choosing What You Are Looking At",
                content: `
                    <p>The <strong>Lens</strong> decides which tournaments the numbers are drawn from. Everything else follows it &mdash; Dashboard, Leaderboard and Players all reflect whatever the Lens currently selects.</p>
                    <p>It sits at the top of every view, under the view buttons:</p>
                    <ul>
                        <li><strong>Tournament name</strong> &mdash; narrows it as you type</li>
                        <li><strong>From / to</strong> &mdash; limits it to a date range</li>
                        <li><strong>Half-year buttons</strong> &mdash; the current or previous half-year in one click, which is usually what a season is</li>
                        <li><strong>Show all</strong> &mdash; back to everything</li>
                    </ul>
                    <p>To leave out single tournaments, click <strong>Choose tournaments</strong> and untick them in the Register's tournament list.</p>
                    <p><strong>💡 To the left of the Lens it says how many tournaments are counted, and why</strong> &mdash; so if a number looks wrong, check there first. It is the usual explanation. The bar turns orange when you are not seeing everything.</p>
                    <p>Analytics always opens on the <strong>current half-year</strong> (the previous one until the new half-year has its first tournament). What you change lasts until you leave the page.</p>
                `
            },
            points: {
                title: "How Points Are Counted",
                content: `
                    <p>The <strong>Points</strong> buttons sit beside the view buttons, and change every figure on screen as soon as you touch them.</p>
                    <ul>
                        <li><strong>As played</strong> &mdash; each tournament scored as it was played: its own point values, with placement and attendance points. The honest record, and what Analytics opens with.</li>
                        <li><strong>Custom</strong> &mdash; opens a small panel:
                            <ul>
                                <li><strong>Point values:</strong> from Global Settings (<strong>Custom Settings</strong> on a shared Analytics instance; useful for "what would last season look like under this year's rules?"), or as each tournament was played</li>
                                <li><strong>Count:</strong> placement points and attendance points, each on or off. Turn attendance off to see standings on performance alone; turn placement off to see who simply turns up</li>
                            </ul>
                            The button then says what is custom, e.g. <em>Custom: Global Settings values, no attendance</em> (<em>Custom: custom values</em> on a shared Analytics instance). Your choice is kept until you leave the page.</li>
                    </ul>
                    <p>Achievement points &mdash; 180s, high outs, short legs, tons &mdash; always count.</p>
                    <p><strong>💡 None of this alters a stored result.</strong> It changes how the totals are worked out for display, nothing more.</p>
                `
            },
            leaderboard: {
                title: "Leaderboard",
                content: `
                    <p>One row per player across the selected tournaments. Click any column heading to sort by it. In points order, a line marks the top 16.</p>
                    <ul>
                        <li><strong>Placements</strong> &mdash; 1st, 2nd, 3rd, 4th, 5-6th and 7-8th finishes</li>
                        <li><strong>Achievements</strong> &mdash; 180s, high outs and short legs</li>
                        <li><strong>Personal bests</strong> &mdash; Best Out (highest checkout) and Best Leg (fewest darts)</li>
                        <li><strong>Avg</strong> &mdash; three-dart average. Only matches scored on the Chalker have the detail to calculate this, so it is blank for manually entered results</li>
                        <li><strong>Matches W / L</strong> and <strong>Legs W / L</strong> &mdash; won and lost</li>
                    </ul>
                    <p><strong>Export CSV</strong> and <strong>Export JSON</strong> save the table as it currently stands &mdash; same Lens, same point settings &mdash; for a spreadsheet or a club website.</p>
                `
            },
            players: {
                title: "Players",
                content: `
                    <p>The player list shows everyone who appears in the selected tournaments, with tournaments played and their win/loss record. Tick one player to see their profile, or up to six to compare them; the box at the top ticks the six best. The page opens on the best player in the lens (or those sharing the top points).</p>
                    <p>The profile has the player's Leaderboard figures, how often they finished in each place, and every tournament they played, with their placing and points. Click a tournament to open it.</p>
                    <p><strong>Charts</strong> show how the player has done over the tournaments in the Lens: their last 10 finishes, then six cards (Position in the standings, Points, Finishes, Average, Matches, Highlights). Click a card for its chart; hover or tap a tournament for the figures. <strong>+ Compare with</strong> adds up to five more players, <strong>The field</strong> adds the median of everyone who played (Points and Average), and <strong>Full screen</strong> gives the chart the whole screen. Ticking several players in the list compares them the same way.</p>
                    <p>Players are matched by name across tournaments, so someone entered as "Dave" in one and "dave " in another is treated as the same person. Genuinely different spellings are not &mdash; consistent names are worth the small effort at registration.</p>
                `
            },
            tournaments: {
                title: "Tournament List",
                content: `
                    <p>Each row shows a finalized tournament — date, format, players, matches, points and the winner. Unticked tournaments are left out of every view.</p>
                    <ul>
                        <li><strong>Click a tournament</strong> to open its matches</li>
                        <li><strong>Delete:</strong> Permanently removes the tournament and all its matches. You must type the tournament name to confirm — this cannot be undone</li>
                        <li><strong>Edit:</strong> Correct a player's 180s, tons, lollipops, high outs and short legs for that tournament. Corrections are saved on the server and apply on every device; the recorded tournament is not changed. <strong>Reset Player</strong> goes back to what was recorded. Docker only, and not shown on the public Analytics page</li>
                    </ul>
                `
            },
            matches: {
                title: "Match Detail",
                content: `
                    <p>Click any tournament to see its matches. Click a match to open the detail view.</p>
                    <ul>
                        <li><strong>Chalker matches:</strong> Show full leg-by-leg breakdown — visit scores, first thrower, checkout darts</li>
                        <li><strong>Achievements:</strong> 180s, tons, high outs, short legs — shown when recorded</li>
                        <li><strong>Manual matches:</strong> Show result only (no visit data)</li>
                    </ul>
                `
            },
            register: {
                title: "Export & Import Register",
                content: `
                    <p><strong>Export Register:</strong> Download the full match history as a JSON file — useful for backups or moving to a new device.</p>
                    <p><strong>Import Register:</strong> Merge a previously exported file into the current history. Existing records with the same match ID are overwritten; everything else is untouched.</p>
                `
            }
        }
    },

    // Contextual Help for Common Scenarios
    scenarios: {
        title: "Common Scenarios",
        overview: "Guidance for getting started, and for the problems that come up most often.",
        sections: {
            firstTime: {
                title: "First Time Setup",
                content: `
                    <h4>Welcome to Tournament Manager!</h4>
                    <p><strong>Quick Start Guide:</strong></p>
                    <ol>
                        <li><strong>Setup:</strong> Create your first tournament with name and date</li>
                        <li><strong>Registration:</strong> Add players and mark them as paid</li>
                        <li><strong>Tournament:</strong> Generate bracket and start managing matches</li>
                        <li><strong>Config:</strong> Customize point values and settings (optional)</li>
                    </ol>
                    <p><strong>💡 Need help?</strong> Each page has specific guidance - click the help button (?) for detailed instructions.</p>
                `
            },
            troubleshooting: {
                title: "Common Issues",
                content: `
                    <p><strong>Can't generate bracket:</strong></p>
                    <ul>
                        <li>Need at least 4 paid players</li>
                        <li>Check that players are marked as "Paid"</li>
                        <li>If tournament is in progress, use "Reset Tournament" first</li>
                    </ul>
                    <p><strong>Match won't start:</strong></p>
                    <ul>
                        <li>Both players must be determined (not "Awaiting Player")</li>
                        <li>Previous matches may need to be completed first</li>
                        <li>Check for walkover situations</li>
                    </ul>
                    <p><strong>Points not calculating correctly:</strong></p>
                    <ul>
                        <li>Verify point values in Config page</li>
                        <li>Check player statistics are entered correctly</li>
                        <li>Ensure tournament is properly completed</li>
                    </ul>
                `
            }
        }
    }
};

/**
 * HELP SYSTEM STATE MANAGEMENT
 */
let helpState = {
    isVisible: false,
    currentPage: 'setup',
    currentSection: null,
    position: { x: 100, y: 100 }
};

/**
 * INITIALIZE HELP SYSTEM
 * Call this after DOM is loaded
 */
function initializeHelpSystem() {
    console.log('🔧 Initializing dynamic help system...');

    // Initialize help icons with tooltips
    initializeHelpIcons();

    // Create help modal
    createHelpModal();

    // Setup context detection
    setupContextDetection();

    // Add keyboard shortcuts
    setupHelpKeyboardShortcuts();

    console.log('✓ Help system initialized');
}

/**
 * INITIALIZE HELP ICONS
 * Add click functionality to help info icons
 */
function initializeHelpIcons() {
    const helpIcons = document.querySelectorAll('.help-info-icon');

    helpIcons.forEach(icon => {
        const pageId = icon.getAttribute('data-page');
        if (!pageId) return;

        // Click icon to open help
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            showHelp(pageId);
        });
    });
}

/**
 * CREATE HELP MODAL
 * Build the floating help interface
 */
function createHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'dynamicHelpModal';
    modal.className = 'help-modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 50px;
        right: 50px;
        width: 400px;
        max-height: 80vh;
        background: #ffffff;
        border: 2px solid #ff6b35;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        overflow: hidden;
        resize: both;
        min-width: 350px;
        min-height: 200px;
    `;

    modal.innerHTML = `
        <div class="help-header" style="
            background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);
            color: white;
            padding: 15px 20px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
        ">
            <span id="helpTitle">Tournament Help</span>
            <div>
                <button id="helpMinimize" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-right: 10px;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                ">−</button>
                <button id="helpClose" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                ">×</button>
            </div>
        </div>
        
        <div class="help-content" style="
            padding: 20px;
            max-height: calc(80vh - 60px);
            overflow-y: auto;
            color: #111827;
            line-height: 1.6;
        ">
            <div id="helpOverview" style="margin-bottom: 20px;"></div>
            <div id="helpSections"></div>
            <div id="helpNavigation" style="
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <button id="helpShowScenarios" class="btn" style="font-size: 12px; padding: 6px 12px;">
                    Common Issues
                </button>
                <span style="font-size: 12px; color: #6b7280;">
                    Press F1 for help • ESC to close
                </span>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Setup modal interactions
    setupHelpModalInteractions(modal);
}

/**
 * SETUP HELP MODAL INTERACTIONS
 */
function setupHelpModalInteractions(modal) {
    const header = modal.querySelector('.help-header');
    const closeBtn = modal.querySelector('#helpClose');
    const minimizeBtn = modal.querySelector('#helpMinimize');
    const scenariosBtn = modal.querySelector('#helpShowScenarios');

    // Make modal draggable
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragOffset.x = e.clientX - modal.offsetLeft;
        dragOffset.y = e.clientY - modal.offsetTop;
        modal.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep modal within viewport
        const maxX = window.innerWidth - modal.offsetWidth;
        const maxY = window.innerHeight - modal.offsetHeight;

        modal.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        modal.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        modal.style.right = 'auto'; // Remove right positioning
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        modal.style.cursor = 'auto';
    });

    // Close button
    closeBtn.addEventListener('click', hideHelp);

    // Minimize button
    minimizeBtn.addEventListener('click', () => {
        const content = modal.querySelector('.help-content');
        if (content.style.display === 'none') {
            content.style.display = 'block';
            minimizeBtn.textContent = '−';
            modal.style.height = 'auto';
        } else {
            content.style.display = 'none';
            minimizeBtn.textContent = '+';
            modal.style.height = '60px';
        }
    });

    // Scenarios button
    scenariosBtn.addEventListener('click', () => {
        showHelpSection('scenarios', 'troubleshooting');
    });
}

/**
 * Point the help system at a new page (6.4).
 *
 * Called from showPage() — the single place that moves the `.page.active` class —
 * so the help system learns about a navigation directly instead of inferring it.
 * This replaced a MutationObserver on the whole body subtree (childList + subtree +
 * class attributes), which woke on *every* DOM change in the app — each bracket
 * render, each clock tick — and ran a `querySelector('.page.active')` every time,
 * to detect an event the app already knows it is causing.
 *
 * Safe to call before the help system is initialized: it only updates state, and
 * updateHelpContext() does nothing while the help modal is closed.
 *
 * @param {string} pageId - id of the page now active (e.g. 'setup', 'tournament')
 * @returns {void}
 */
function setHelpPage(pageId) {
    if (!pageId || pageId === helpState.currentPage) return;
    helpState.currentPage = pageId;
    updateHelpContext();
}

/**
 * SETUP CONTEXT DETECTION
 * Automatically detect user context and show relevant help
 */
function setupContextDetection() {
    // Page changes arrive via setHelpPage(), called from showPage()

    // Detect first-time user (the first-run guide is for the Tournament Manager, not Analytics)
    if (window.NEWTON_APP_MODE !== 'analytics' && !localStorage.getItem('helpSystemSeen')) {
        setTimeout(() => {
            showHelp('scenarios', 'firstTime');
            localStorage.setItem('helpSystemSeen', 'true');
        }, 2000);
    }
}

/**
 * SETUP KEYBOARD SHORTCUTS
 */
function setupHelpKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // F1 - Show help for current page
        if (e.key === 'F1') {
            e.preventDefault();
            if (helpState.isVisible) {
                hideHelp();
            } else {
                showHelp(helpState.currentPage);
            }
        }

        // ESC - Close help
        if (e.key === 'Escape' && helpState.isVisible) {
            hideHelp();
        }

        // Ctrl+H - Toggle help
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            toggleHelp();
        }
    });
}

/**
 * SHOW HELP
 * Display help for specific page and optionally specific section
 */
function showHelp(pageId = 'setup', sectionId = null) {
    const modal = document.getElementById('dynamicHelpModal');
    if (!modal) return;

    helpState.isVisible = true;
    helpState.currentPage = pageId;
    helpState.currentSection = sectionId;

    // Update help content
    updateHelpContent(pageId, sectionId);

    // Show modal
    modal.style.display = 'block';

    // Focus for keyboard navigation
    modal.focus();

    console.log(`📖 Help shown for ${pageId}${sectionId ? ` > ${sectionId}` : ''}`);
}

/**
 * HIDE HELP
 */
function hideHelp() {
    const modal = document.getElementById('dynamicHelpModal');
    if (!modal) return;

    modal.style.display = 'none';
    helpState.isVisible = false;

    console.log('📖 Help hidden');
}

/**
 * TOGGLE HELP
 */
function toggleHelp() {
    if (helpState.isVisible) {
        hideHelp();
    } else {
        showHelp(helpState.currentPage);
    }
}

/**
 * UPDATE HELP CONTEXT
 * Called when page changes to update help relevance
 */
function updateHelpContext() {
    if (!helpState.isVisible) return;

    // Update help content for new page
    updateHelpContent(helpState.currentPage);
}

/**
 * UPDATE HELP CONTENT
 * Populate modal with relevant help information
 */
function updateHelpContent(pageId, sectionId = null) {
    const helpData = HELP_CONTENT[pageId];
    if (!helpData) {
        console.warn(`No help content found for page: ${pageId}`);
        return;
    }

    const titleElement = document.getElementById('helpTitle');
    const overviewElement = document.getElementById('helpOverview');
    const sectionsElement = document.getElementById('helpSections');

    // Update title
    if (titleElement) {
        titleElement.textContent = helpData.title;
    }

    // Update overview
    if (overviewElement) {
        overviewElement.innerHTML = `
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #ff6b35;">
                <strong>Overview:</strong> ${helpData.overview}
            </div>
        `;
    }

    // Update sections
    if (sectionsElement && helpData.sections) {
        let sectionsHTML = '';

        Object.entries(helpData.sections).forEach(([key, section]) => {
            const isExpanded = sectionId === key || sectionId === null;

            sectionsHTML += `
                <div class="help-section" style="margin-bottom: 15px;">
                    <h4 style="
                        cursor: pointer;
                        color: #ff6b35;
                        margin: 0 0 10px 0;
                        padding: 8px 12px;
                        background: #fff7f0;
                        border-radius: 6px;
                        border-left: 3px solid #ff6b35;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    " onclick="toggleHelpSection('${key}')">
                        ${section.title}
                        <span id="toggle-${key}" style="font-size: 14px;">
                            ${isExpanded ? '−' : '+'}
                        </span>
                    </h4>
                    <div id="section-${key}" style="
                        display: ${isExpanded ? 'block' : 'none'};
                        padding-left: 15px;
                        border-left: 2px solid #f3f4f6;
                        margin-left: 10px;
                    ">
                        ${section.content}
                    </div>
                </div>
            `;
        });

        sectionsElement.innerHTML = sectionsHTML;
    }

    // Add quick actions based on current page
    addQuickActions(pageId);
}

/**
 * ADD QUICK ACTIONS
 * Context-sensitive action buttons
 */
function addQuickActions(pageId) {
    const navigation = document.getElementById('helpNavigation');
    if (!navigation) return;

    // Remove existing quick actions
    const existingActions = navigation.querySelector('.quick-actions');
    if (existingActions) {
        existingActions.remove();
    }

    const quickActions = document.createElement('div');
    quickActions.className = 'quick-actions';
    quickActions.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    let actionsHTML = '';

    switch (pageId) {
        case 'setup':
            if (!tournament) {
                actionsHTML = '<button class="btn btn-success" onclick="hideHelp(); showPage(\'setup\');" style="font-size: 12px; padding: 6px 12px;">Create Tournament</button>';
            }
            break;

        case 'registration':
            if (tournament && players.filter(p => p.paid).length < 4) {
                actionsHTML = '<button class="btn btn-warning" onclick="hideHelp(); document.getElementById(\'playerName\').focus();" style="font-size: 12px; padding: 6px 12px;">Add Players</button>';
            } else if (tournament && !tournament.bracket) {
                actionsHTML = '<button class="btn btn-success" onclick="hideHelp(); showPage(\'tournament\');" style="font-size: 12px; padding: 6px 12px;">Go to Tournament</button>';
            }
            break;

        case 'tournament':
            if (tournament && !tournament.bracket) {
                actionsHTML = '<button class="btn btn-success" onclick="hideHelp(); showBracketView(\'controls\');" style="font-size: 12px; padding: 6px 12px;">Open Match Controls</button>';
            }
            break;

        case 'config':
            actionsHTML = '<button class="btn" onclick="hideHelp(); showPage(\'setup\');" style="font-size: 12px; padding: 6px 12px;">Back to Setup</button>';
            break;
    }

    if (actionsHTML) {
        quickActions.innerHTML = actionsHTML;
        navigation.insertBefore(quickActions, navigation.firstChild);
    }
}

/**
 * TOGGLE HELP SECTION
 * Expand/collapse individual help sections
 */
function toggleHelpSection(sectionId) {
    const section = document.getElementById(`section-${sectionId}`);
    const toggle = document.getElementById(`toggle-${sectionId}`);

    if (!section || !toggle) return;

    if (section.style.display === 'none') {
        section.style.display = 'block';
        toggle.textContent = '−';
    } else {
        section.style.display = 'none';
        toggle.textContent = '+';
    }
}

/**
 * SHOW HELP SECTION
 * Direct navigation to specific help section
 */
function showHelpSection(pageId, sectionId) {
    showHelp(pageId, sectionId);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    // Core help functions
    window.initializeHelpSystem = initializeHelpSystem;
    window.showHelp = showHelp;
    window.hideHelp = hideHelp;
    window.toggleHelp = toggleHelp;
    window.toggleHelpSection = toggleHelpSection;
    window.showHelpSection = showHelpSection;

    console.log('✅ Dynamic help system functions registered globally');
}
