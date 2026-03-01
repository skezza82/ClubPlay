const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, setDoc, runTransaction, increment } = require("firebase/firestore");

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

const FEEDER_CLUB_ID = "feeder-club-global-v1";

async function addAllUsersToFeeder() {
    console.log("Adding all users to The Starter Squad...");

    // Get all users
    const usersSnap = await getDocs(collection(db, "users"));
    console.log(`Found ${usersSnap.size} users.`);

    let addedCount = 0;

    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const userData = userDoc.data();

        // Ensure not already in feeder club? We can just add or overwrite membership.
        // It's safer to check first.
        try {
            await runTransaction(db, async (transaction) => {
                const memberRef = doc(db, "clubs", FEEDER_CLUB_ID, "members", uid);
                const memberSnap = await transaction.get(memberRef);

                if (!memberSnap.exists()) {
                    transaction.set(memberRef, {
                        role: 'member',
                        joinedAt: new Date(),
                        addedByScript: true
                    });

                    const clubRef = doc(db, "clubs", FEEDER_CLUB_ID);
                    transaction.update(clubRef, { memberCount: increment(1) });

                    const userRef = doc(db, "users", uid);
                    transaction.update(userRef, { hasJoinedFeederClub: true });

                    addedCount++;
                }
            });
        } catch (e) {
            console.error(`Error adding user ${uid}:`, e);
        }
    }

    console.log(`Successfully added ${addedCount} new members to the Feeder Club.`);
    process.exit(0);
}

addAllUsersToFeeder().catch(console.error);
