const { initializeApp } = require("firebase/app");
const { getFirestore, doc, deleteDoc, writeBatch, collection, query, where, getDocs } = require("firebase/firestore");

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

const clubId = 'retro-gaming-club';

async function disbandClub() {
    console.log(`Disbanding club ${clubId}...`);
    try {
        // 1. Delete Club Doc
        console.log("Deleting club document...");
        await deleteDoc(doc(db, "clubs", clubId));

        // 2. Cleanup Memberships and Join Requests using batches
        console.log("Cleaning up memberships and requests...");
        const batch = writeBatch(db);

        const membershipsQ = query(collection(db, "memberships"), where("clubId", "==", clubId));
        const memSnap = await getDocs(membershipsQ);
        memSnap.docs.forEach(d => batch.delete(d.ref));

        const reqQ = query(collection(db, "join_requests"), where("clubId", "==", clubId));
        const reqSnap = await getDocs(reqQ);
        reqSnap.docs.forEach(d => batch.delete(d.ref));

        await batch.commit();
        console.log("Club disbanded successfully.");
    } catch (e) {
        console.error("Error disbanding club:", e);
    }
    process.exit(0);
}

disbandClub();
