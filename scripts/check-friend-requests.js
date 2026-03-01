const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, getDocs } = require("firebase/firestore");
const fs = require("fs");

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

async function inspectFriendRequests() {
    const q = query(collection(db, "friend_requests"));
    const snap = await getDocs(q);
    const results = [];
    snap.forEach(d => {
        results.push({ id: d.id, ...d.data() });
    });
    fs.writeFileSync("out2.json", JSON.stringify(results, null, 2));
    process.exit(0);
}
inspectFriendRequests();
