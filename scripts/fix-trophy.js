const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc } = require("firebase/firestore");

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

async function fixTrophy() {
    console.log("Fixing trophy...");
    try {
        const clubRef = doc(db, "clubs", "8OSNkH2sZ9Dhoy9QaZCk");
        await updateDoc(clubRef, {
            latestWinnerId: null,
            latestWinnerName: null
        });
        console.log("Cleared latestWinnerId for club 8OSNkH2sZ9Dhoy9QaZCk");
    } catch (e) {
        console.error("Error updating club:", e);
    }
    process.exit(0);
}

fixTrophy();
