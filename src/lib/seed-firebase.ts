import {
    setDoc,
    doc,
    getDoc,
    Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

export const seedFirebaseData = async () => {
    // 1. Check if data already exists to avoid redundant writes
    const clubRef = doc(db, "clubs", "club-1");
    const clubSnap = await getDoc(clubRef);

    if (clubSnap.exists()) {
        console.log("Firebase data already seeded. Skipping.");
        return;
    }

    console.log("Seeding Firebase data for the first time...");

    // 2. Seed Clubs
    await setDoc(clubRef, {
        name: "The Porckchop Xpress",
        ownerId: "user-1",
        createdAt: Timestamp.now(),
        inviteCode: "PORK",
        memberCount: 1
    });

    // 2.5 Seed Membership (CRITICAL for security rules)
    const membershipRef = doc(db, "memberships", "user-1_club-1");
    await setDoc(membershipRef, {
        clubId: "club-1",
        userId: "user-1",
        displayName: "skezz_gamer",
        role: "owner",
        joinedAt: new Date().toISOString()
    });

    // 3. Seed Weekly Session
    const sessionRef = doc(db, "weekly_sessions", "sess-1");
    await setDoc(sessionRef, {
        clubId: "club-1",
        gameId: "game-1", // Tetris
        isActive: true,
        startDate: Timestamp.now(),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
    });

    // 4. Seed Scores
    const scoreRef = doc(db, "scores", "sc-1");
    await setDoc(scoreRef, {
        sessionId: "sess-1",
        userId: "user-1",
        scoreValue: 15400,
        displayName: "skezz_gamer",
        submittedAt: Timestamp.now()
    });

    console.log("Firebase seeding complete!");
};
