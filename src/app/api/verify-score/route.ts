import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Using client SDK for now as admin SDK setup is unknown
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { verifyScoreWithAI } from "@/lib/gemini";
import { addXp } from "@/lib/firestore-service";

export async function POST(req: Request) {
    try {
        const { scoreId, clubId } = await req.json();

        if (!scoreId) {
            return NextResponse.json({ error: "Missing scoreId" }, { status: 400 });
        }

        // 1. Fetch the score from Firestore
        console.log(`[API] Starting verification for score: ${scoreId}`);
        const scoreRef = doc(db, "scores", scoreId);
        const scoreSnap = await getDoc(scoreRef);

        if (!scoreSnap.exists()) {
            return NextResponse.json({ error: "Score not found" }, { status: 404 });
        }

        const scoreData = scoreSnap.data();

        // 2. Check if it's already verified or if there's no proof
        if (scoreData.status === "verified") {
            return NextResponse.json({ message: "Already verified" });
        }

        if (!scoreData.proofUrl) {
            return NextResponse.json({ error: "No proof image found for this score" }, { status: 400 });
        }

        // 3. Call Gemini for verification
        const aiResult = await verifyScoreWithAI(
            scoreData.proofUrl,
            scoreData.scoreValue,
            scoreData.displayName || "Unknown"
        );

        console.log(`[API] Gemini result for ${scoreId}:`, aiResult);

        // 4. Update Firestore based on results
        if (aiResult.matchScore && aiResult.matchName && aiResult.confidence > 0.8) {
            // SUCCESS: Auto-verify
            await updateDoc(scoreRef, {
                status: "verified",
                aiVerification: {
                    verifiedAt: new Date().toISOString(),
                    confidence: aiResult.confidence,
                    reasoning: aiResult.reasoning,
                },
                // We might want to keep proofUrl for a bit or delete it
                // proofUrl: deleteField() // Logic from functions/index.js
            });

            // Award bonus XP for verified high-score? Or just standard.
            if (scoreData.userId) {
                await addXp(scoreData.userId, 50, "Score Verified by AI");
            }

            return NextResponse.json({
                success: true,
                status: "verified",
                aiResult
            });
        } else {
            // FAILURE or LOW CONFIDENCE: Keep as pending or reject
            const newStatus = aiResult.confidence < 0.5 ? "rejected" : "pending_verification";

            await updateDoc(scoreRef, {
                status: newStatus,
                aiVerification: {
                    lastCheckAt: new Date().toISOString(),
                    confidence: aiResult.confidence,
                    reasoning: aiResult.reasoning,
                    matchScore: aiResult.matchScore,
                    matchName: aiResult.matchName
                }
            });

            return NextResponse.json({
                success: false,
                status: newStatus,
                aiResult
            });
        }

    } catch (error: any) {
        console.error("[API] Verification Route Error:", error);
        return NextResponse.json({
            error: "Internal server error during verification",
            details: error.message
        }, { status: 500 });
    }
}
