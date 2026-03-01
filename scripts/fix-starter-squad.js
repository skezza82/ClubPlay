const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, writeBatch, setDoc } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyCVuiErt5sljD3XrDpjn-N4OE41Z_CkRUE",
    authDomain: "club-play-app.firebaseapp.com",
    projectId: "club-play-app",
    storageBucket: "club-play-app.firebasestorage.app",
    messagingSenderId: "160859763710",
    appId: "1:160859763710:web:4bdd540f98a961820a86af"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixMembers() {
    console.log("Fixing Starter Squad Members...");
    try {
        const FEEDER_CLUB_ID = "feeder-club-global-v1";

        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch memberships
        const membershipsSnapshot = await getDocs(collection(db, "memberships"));
        const existingMemberIds = new Set(
            membershipsSnapshot.docs
                .map(d => d.data())
                .filter(m => m.clubId === FEEDER_CLUB_ID)
                .map(m => m.userId)
        );

        let addedCount = 0;
        const batch = writeBatch(db);

        for (const user of allUsers) {
            if (!existingMemberIds.has(user.id)) {
                // Add membership
                const membershipRef = doc(db, "memberships", `${FEEDER_CLUB_ID}_${user.id}`);
                batch.set(membershipRef, {
                    clubId: FEEDER_CLUB_ID,
                    userId: user.id,
                    role: "member",
                    joinedAt: new Date().toISOString()
                });
                addedCount++;

                // Add placeholder standings so they aren't blank
                const standingRef = doc(db, "season_standings", `${FEEDER_CLUB_ID}_${user.id}`);
                batch.set(standingRef, {
                    clubId: FEEDER_CLUB_ID,
                    userId: user.id,
                    points: 0,
                    wins: 0
                }, { merge: true });
            }
        }

        if (addedCount > 0) {
            const newTotal = existingMemberIds.size + addedCount;
            // Update club count
            const clubRef = doc(db, "clubs", FEEDER_CLUB_ID);
            batch.update(clubRef, { memberCount: newTotal });
            await batch.commit();
            console.log(`Successfully added ${addedCount} new members! Total mapped: ${newTotal}`);
        } else {
            console.log("No new members missed.");
        }
    } catch (e) {
        console.error("Error migrating members:", e);
    }
    process.exit(0);
}

fixMembers();
