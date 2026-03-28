// newton-stats.js — TM-side stats extraction from raw Chalker match payload
// Pure functions only. No side effects. No coupling to QR, bracket, or player management.
// Designed for reuse: QR completion flow, Players' Lab, and any future stat consumers.

const NewtonStats = {

    /**
     * Decode base64-encoded visit scores for one player from a leg's 's' field.
     * Format: "P1_BASE64|P2_BASE64" — each byte is one visit score (0–180).
     * @param {string} s - the leg's 's' field
     * @param {number} playerIndex - 0 for player 1, 1 for player 2
     * @returns {number[]}
     */
    decodeVisits(s, playerIndex) {
        try {
            const parts = (s || '').split('|');
            const bytes = Uint8Array.from(atob(parts[playerIndex] || ''), c => c.charCodeAt(0));
            return Array.from(bytes);
        } catch (_) {
            return [];
        }
    },

    /**
     * Extract achievements for one player across all legs.
     * Does NOT include lollipops — those require operator input and are applied separately.
     *
     * @param {object[]} legs - payload.legs array ({ w, s, cd })
     * @param {number} playerIndex - 0 for player 1, 1 for player 2
     * @param {number} [shortLegThreshold=21] - max darts for a short leg
     * @returns {{ oneEighties: number, tons: number, highOuts: number[], shortLegs: number[] }}
     */
    extractAchievements(legs, playerIndex, shortLegThreshold = 21) {
        const result = { oneEighties: 0, tons: 0, highOuts: [], shortLegs: [] };

        legs.forEach(leg => {
            const visits = this.decodeVisits(leg.s, playerIndex);
            const isTiebreak = leg.cd === 0;
            const playerWonLeg = leg.w === playerIndex + 1;

            visits.forEach((score, i) => {
                if (score === 180) {
                    result.oneEighties++;
                } else if (score >= 100) {
                    result.tons++;
                }

                // High out: last visit of a won non-tiebreak leg, checkout score >= 101
                if (playerWonLeg && !isTiebreak && i === visits.length - 1 && score >= 101) {
                    result.highOuts.push(score);
                }
            });

            // Short leg: won non-tiebreak leg completed within the threshold
            // Total darts = (visits - 1) × 3 + checkout darts
            if (playerWonLeg && !isTiebreak && visits.length > 0) {
                const totalDarts = (visits.length - 1) * 3 + leg.cd;
                if (totalDarts <= shortLegThreshold) {
                    result.shortLegs.push(totalDarts);
                }
            }
        });

        return result;
    },

    /**
     * Returns true if a stats object contains any non-zero/non-empty achievement.
     * @param {{ oneEighties, tons, highOuts, shortLegs, lollipops }} stats
     * @returns {boolean}
     */
    hasAny(stats) {
        if (!stats) return false;
        return stats.oneEighties > 0 ||
            stats.tons > 0 ||
            stats.lollipops > 0 ||
            (stats.highOuts && stats.highOuts.length > 0) ||
            (stats.shortLegs && stats.shortLegs.length > 0);
    }
};
