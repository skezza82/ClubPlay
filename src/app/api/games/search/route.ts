import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/igdb";

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query || typeof query !== "string") {
            return NextResponse.json({ error: "Invalid query" }, { status: 400 });
        }

        const games = await searchGames(query);
        return NextResponse.json({ games });
    } catch (error) {
        console.error("Search API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
