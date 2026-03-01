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

const userId = 'X9RgGptWKmZNHa4gKLt3b5e1rTF2';

async function checkMemberships() {
    console.log(`Checking memberships for user ${userId}...`);
    const membershipsRef = collection(db, "memberships");
    const q = query(membershipsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        console.log("No memberships found.");
    } else {
        snapshot.forEach(doc => {
            console.log(`Membership ID: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
        });
    }

    process.exit(0);
}

checkMemberships();
