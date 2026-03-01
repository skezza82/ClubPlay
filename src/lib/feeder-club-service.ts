import { doc, getDoc, setDoc, collection, runTransaction, increment, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const FEEDER_CLUB_ID = "feeder-club-global-v1";
const FEEDER_CLUB_CODE = "ROOKIE";
const FEEDER_SESSION_ID = "feeder-club-6-month-pacman";

export const ensureFeederClubMembership = async (userId: string, displayName: string | null, photoURL: string | null) => {
    try {
        // 1. Ensure the feeder club exists
        const clubRef = doc(db, "clubs", FEEDER_CLUB_ID);
        const clubSnap = await getDoc(clubRef);

        if (!clubSnap.exists()) {
            // Create the global feeder club
            await setDoc(clubRef, {
                id: FEEDER_CLUB_ID,
                name: "The Starter Squad",
                inviteCode: FEEDER_CLUB_CODE,
                ownerId: "system",
                memberCount: 0,
                logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Pac_Man.svg/1200px-Pac_Man.svg.png",
                bio: "Welcome to The Starter Squad! A club for all new members to learn the ropes and complete the 6-month Pac-Man rookie challenge.",
                createdAt: new Date().toISOString(),
                isOfficialFeeder: true
            });
        }

        // 2. Ensure the 6-month Pacman session exists
        const sessionRef = doc(db, "weekly_sessions", FEEDER_SESSION_ID);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 6);

            await setDoc(sessionRef, {
                id: FEEDER_SESSION_ID,
                clubId: FEEDER_CLUB_ID,
                gameId: "pacman",
                gameTitle: "Pac-Man",
                platform: "Arcade",
                rules: "Get the highest score possible in the 6-month rookie period!",
                isActive: true,
                challengeType: "score",
                cover_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Pac_Man.svg/1200px-Pac_Man.svg.png",
                isProcessed: false,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });
        }

        // 3. Add user to the club if not already a member
        const membershipId = `${userId}_${FEEDER_CLUB_ID}`;
        const membershipRef = doc(db, "memberships", membershipId);
        const membershipSnap = await getDoc(membershipRef);

        if (!membershipSnap.exists()) {
            await runTransaction(db, async (transaction) => {
                const currentClubDoc = await transaction.get(clubRef);

                transaction.set(membershipRef, {
                    clubId: FEEDER_CLUB_ID,
                    userId,
                    displayName: displayName || "Unknown Rookie",
                    photoURL: photoURL || null,
                    role: 'member',
                    joinedAt: new Date().toISOString()
                });

                if (currentClubDoc.exists()) {
                    transaction.update(clubRef, { memberCount: increment(1) });
                }

                // Give them standard joining XP (they probably don't have it yet since it's their first club)
                const userRef = doc(db, "users", userId);
                transaction.update(userRef, {
                    xp: increment(100),
                    questClubJoinedAwarded: true
                });
            });
        }
    } catch (error) {
        console.error("Failed to ensure feeder club membership:", error);
    }
};
