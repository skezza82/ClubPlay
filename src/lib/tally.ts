
import { supabase } from "./supabase";

/**
 * MIDNIGHT TALLY LOGIC
 * intended to run as a scheduled CRON job (Edge Function in Supabase).
 * 
 * Logic:
 * 1. Find active sessions that have passed their end_date.
 * 2. Tally scores for that session.
 * 3. Assign Season Points (100, 50, 25, 10).
 * 4. Close session.
 * 5. (Optional) Create next session.
 */

export async function runMidnightTally() {
    console.log("Running Midnight Tally...");

    // 1. Get Expired Sessions
    // In a real DB we would query: end_date < NOW() AND is_active = true
    const now = new Date().toISOString();
    const { data: sessions } = await supabase.from('weekly_sessions')
        .select('*')
        .eq('is_active', true);
    // .lt('end_date', now); // Mock client simple filter support

    if (!sessions) return;

    for (const session of sessions) {
        // Double check expiry (since mock client might return all active)
        if (new Date(session.end_date) > new Date()) {
            console.log(`Session ${session.id} not yet expired.`);
            continue;
        }

        console.log(`Processing Session: ${session.id}`);

        // 2. Get Scores
        const { data: scores } = await supabase.from('scores')
            .select('*')
            .eq('session_id', session.id)
            .order('score_value', { ascending: false });

        if (!scores) continue;

        // Dedupe users (keep highest score only)
        const userHighScores = new Map<string, number>();
        scores.forEach((s: any) => {
            if (!userHighScores.has(s.user_id)) {
                userHighScores.set(s.user_id, s.score_value);
            }
        });

        // Convert to sorted array
        const sortedStandings = Array.from(userHighScores.entries())
            .map(([userId, score]) => ({ userId, score }))
            .sort((a, b) => b.score - a.score);

        // 3. Distribute Points
        for (let i = 0; i < sortedStandings.length; i++) {
            const { userId } = sortedStandings[i];
            let points = 10; // Participation default

            if (i === 0) points = 100;
            else if (i === 1) points = 50;
            else if (i === 2) points = 25;

            console.log(`User ${userId} awarded ${points} points (Rank ${i + 1})`);

            // In real DB: Update 'season_standings' table
            // await supabase.rpc('increment_points', { ... }) 
        }

        // 4. Close Session
        // await supabase.from('weekly_sessions').update({ is_active: false }).eq('id', session.id);
        console.log(`Session ${session.id} closed.`);
    }
}
