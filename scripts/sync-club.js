const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, writeBatch, setDoc, updateDoc } = require("firebase/firestore");

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

async function syncMembersCount() {
    console.log("Syncing Starter Squad members... ");
    const FEEDER_CLUB_ID = "feeder-club-global-v1";
    try {
        const membershipsSnapshot = await getDocs(collection(db, "memberships"));
        const existingMemberIds = membershipsSnapshot.docs
            .map(d => d.data())
            .filter(m => m.clubId === FEEDER_CLUB_ID)
            .map(m => m.userId);

        const count = existingMemberIds.length;
        console.log(`Actually found ${count} existing memberships for Starter Squad.`);
        const clubRef = doc(db, "clubs", FEEDER_CLUB_ID);
        await updateDoc(clubRef, { memberCount: count });
        console.log("MEMBER COUNT SYNCED TO: " + count);
    } catch (e) { console.error(e) }
    process.exit(0);
}
syncMembersCount();
