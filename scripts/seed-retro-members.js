
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, collection, addDoc, query, where, getDocs, Timestamp } = require("firebase/firestore");

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

const CLUB_ID = "tKEeB1vXAgTtz4DLunVn";
const SESSION_ID = "6aFbycgHEpbsYsuI9NOQ";

const MOCK_USERS = [
    { name: "Holly", score: 154000 },
    { name: "Baz", score: 121000 },
    { name: "Dan", score: 98500 },
    { name: "Jim", score: 65200 },
    { name: "Loz", score: 42100 }
];

async function seed() {
    try {
        console.log("Starting mock user creation...");

        for (const userData of MOCK_USERS) {
            const userId = `mock_${userData.name.toLowerCase()}`;

            // 1. Create User Document
            await setDoc(doc(db, "users", userId), {
                uid: userId,
                displayName: userData.name,
                photoURL: `/avatars/${userData.name.toLowerCase()}.png`,
                createdAt: new Date().toISOString(),
                isMock: true
            }, { merge: true });

            // 2. Create Membership
            await setDoc(doc(db, "memberships", `${userId}_${CLUB_ID}`), {
                clubId: CLUB_ID,
                userId: userId,
                displayName: userData.name,
                role: 'member',
                joinedAt: new Date().toISOString()
            }, { merge: true });

            // 3. Add Score
            await setDoc(doc(db, "scores", `${userId}_${SESSION_ID}`), {
                sessionId: SESSION_ID,
                userId: userId,
                scoreValue: userData.score,
                displayName: userData.name,
                submittedAt: Timestamp.now()
            }, { merge: true });

            console.log(`Added ${userData.name} with score ${userData.score}`);
        }

        console.log("Mock data seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
}

seed();
