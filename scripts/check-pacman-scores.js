const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyCVuiErt5sljD3XrDpjn-N4OE41Z_CkRUE",
    authDomain: "club-play-app.firebaseapp.com",
    projectId: "club-play-app",
    storageBucket: "club-play-app.firebasestorage.app",
    messagingSenderId: "542387140417",
    appId: "1:542387140417:web:fb2bba29f55074e6900138",
    measurementId: "G-9LSF8P2YV1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkScores() {
    const sessionId = "feeder-club-6-month-pacman";
    console.log(`Checking session: ${sessionId}`);

    console.log("\nChecking scores for this session...");
    const scoresRef = collection(db, "scores");
    const q = query(scoresRef, where("sessionId", "==", sessionId));
    const snap = await getDocs(q);

    console.log(`Found ${snap.size} scores:`);
    snap.forEach(doc => {
        const data = doc.data();
        const date = data.submittedAt && data.submittedAt.toDate ? data.submittedAt.toDate() : "No Date";
        console.log(`- User: ${data.userId}, Score: ${data.scoreValue}, Status: ${data.status}, Submitted: ${date}`);
    });
}

checkScores();
