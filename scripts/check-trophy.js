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

async function checkTrophy() {
    console.log("Checking for Skezza82...");
    const q = query(collection(db, "users"), where("displayName", "==", "Skezza82"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        console.log("No user found with displayName Skezza82");
        process.exit(0);
    }

    const userDoc = snapshot.docs[0];
    const uid = userDoc.id;
    console.log("User found, UID:", uid);

    const clubsSnap = await getDocs(collection(db, "clubs"));
    let foundTrophy = false;
    clubsSnap.forEach(doc => {
        const club = doc.data();
        if (club.latestWinnerId === uid) {
            console.log(`Has trophy from club: ${doc.id} (${club.name})`);
            foundTrophy = true;
        }
    });

    if (!foundTrophy) {
        console.log("No clubs found where this user is latestWinnerId.");
    }

    process.exit(0);
}

checkTrophy().catch(console.error);
