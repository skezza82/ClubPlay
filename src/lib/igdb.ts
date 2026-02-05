import { NextResponse } from "next/server";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken() {
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
        throw new Error("Missing Twitch credentials");
    }

    try {
        const response = await fetch(
            `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
            { method: "POST" }
        );

        if (!response.ok) {
            throw new Error(`Failed to get access token: ${response.statusText}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        // Set expiry to slightly less than actual expiry to be safe (e.g., minus 60 seconds)
        tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

        return accessToken;
    } catch (error) {
        console.error("Error fetching IGDB access token:", error);
        throw error;
    }
}

export async function searchGames(query: string) {
    const token = await getAccessToken();

    if (!token) {
        throw new Error("No access token available");
    }

    try {
        // Search for games by name, get name and cover image
        // Using the search endpoint logic or standard games endpoint with search
        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": TWITCH_CLIENT_ID!,
                "Authorization": `Bearer ${token}`,
            },
            body: `search "${query}"; fields name, cover.url, first_release_date; limit 20;`,
        });

        if (!response.ok) {
            throw new Error(`IGDB API error: ${response.statusText}`);
        }

        const games = await response.json();

        // Process games to get high-res cover URLs (IGDB returns 't_thumb' by default)
        return games.map((game: any) => ({
            id: game.id,
            name: game.name,
            // Replace t_thumb with t_cover_big or t_1080p for better quality
            coverUrl: game.cover?.url ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}` : null,
            releaseDate: game.first_release_date,
        }));
    } catch (error) {
        console.error("Error searching games:", error);
        return [];
    }
}
