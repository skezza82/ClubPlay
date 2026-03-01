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

async function checkOwner() {
    console.log(`Checking owner...`);
    const ownerRef = doc(db, "users", "some_owner_id");
    const snap = await getDoc(ownerRef);
    if (snap.exists()) {
        console.log(`Owner: ${JSON.stringify(snap.data())}`);
    } else {
        console.log("some_owner_id not found in users.");
    }
    process.exit(0);
}

checkOwner();
