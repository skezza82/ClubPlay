import { db } from "./firebase";
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp
} from "firebase/firestore";

export interface HighScore {
    id?: string;
    gameId: string;
    userId: string;
    userDisplayName: string;
    userPhotoURL: string | null;
    score: number;
    timestamp: any; // Firestore Timestamp
}

/**
 * Submit a new high score to Firestore
 */
export async function submitScore(scoreData: Omit<HighScore, "id" | "timestamp">) {
    try {
        const scoresRef = collection(db, "scores");
        await addDoc(scoresRef, {
            ...scoreData,
            timestamp: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error("Error submitting score:", error);
        throw error;
    }
}

/**
 * Get top 10 scores for a specific game
 */
export async function getTopScores(gameId: string, limitCount = 10): Promise<HighScore[]> {
    try {
        const scoresRef = collection(db, "scores");
        const q = query(
            scoresRef,
            where("gameId", "==", gameId),
            orderBy("score", "desc"),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as HighScore[];
    } catch (error) {
        console.error("Error fetching high scores:", error);
        return [];
    }
}
