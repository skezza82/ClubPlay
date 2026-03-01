const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");

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

async function findClub() {
    console.log("Searching for Retro Gaming Club...");
    const clubsRef = collection(db, "clubs");
    const snapshot = await getDocs(clubsRef);

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Club ID: ${doc.id}, Name: ${data.name}`);
    });

    process.exit(0);
}

findClub();
