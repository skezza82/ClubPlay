const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc } = require("firebase/firestore");

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

async function diagnose() {
    const userId = "5VQtDbmp99YAZdCPTdiq4qY6Ia62";
    const clubId = "feeder-club-global-v1";

    console.log(`--- Diagnostics for ${userId} in ${clubId} ---`);

    const clubRef = doc(db, "clubs", clubId);
    const clubSnap = await getDoc(clubRef);
    if (clubSnap.exists()) {
        console.log(`Club Data: ${JSON.stringify(clubSnap.data())}`);
    } else {
        console.log("Club document NOT FOUND.");
    }

    const membershipId = `${clubId}_${userId}`;
    const membershipRef = doc(db, "memberships", membershipId);
    const membershipSnap = await getDoc(membershipRef);
    if (membershipSnap.exists()) {
        console.log(`Membership Data: ${JSON.stringify(membershipSnap.data())}`);
    } else {
        console.log("Membership document NOT FOUND.");
    }

    process.exit(0);
}

diagnose().catch(console.error);
