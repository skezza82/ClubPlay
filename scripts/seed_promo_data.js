
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } = require("firebase/auth");
const { getFirestore, doc, setDoc, collection, addDoc, writeBatch } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyCVuiErt5sljD3XrDpjn-N4OE41Z_CkRUE",
    authDomain: "club-play-app.firebaseapp.com",
    projectId: "club-play-app",
    storageBucket: "club-play-app.firebasestorage.app",
    messagingSenderId: "160859763710",
    appId: "1:160859763710:web:4bdd540f98a961820a86af",
    measurementId: "G-6B4HDZNCCJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
    try {
        console.log("Starting seed...");

        // 1. Create Promo User
        const email = "promo_hero@clubplay.example";
        const password = "password123";
        const displayName = "ProGamer_X";

        let user;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
            console.log("Logged in as existing user:", user.uid);
        } catch (e) {
            console.log("Creating new user...");
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
            await updateProfile(user, { displayName });

            // Create User Doc (manual because not using app context)
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: null,
                createdAt: new Date().toISOString(),
                role: "user"
            });
            console.log("Created users doc");
        }

        // 2. Create Club "Retro Legends"
        const clubRef = doc(collection(db, "clubs"));
        const clubId = clubRef.id;

        // Club Data
        await setDoc(clubRef, {
            id: clubId,
            name: "Retro Legends",
            inviteCode: "RETRO2026",
            ownerId: user.uid,
            memberCount: 5, // Faking it
            createdAt: new Date().toISOString(),
            description: "For the true classics."
        });

        // Membership for Owner
        await setDoc(doc(db, "memberships", `${user.uid}_${clubId}`), {
            clubId: clubId,
            userId: user.uid,
            displayName: displayName,
            role: 'owner',
            joinedAt: new Date().toISOString()
        });

        console.log("Created Club:", clubId);

        // 3. Create Active Session
        const sessionRef = doc(collection(db, "weekly_sessions"));
        const sessionId = sessionRef.id;

        // Future date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 5);

        await setDoc(sessionRef, {
            id: sessionId,
            clubId: clubId,
            gameTitle: "Tetris",
            platform: "NES",
            rules: "Highest Score wins. No glitches.",
            isActive: true,
            startDate: new Date().toISOString(),
            endDate: endDate.toISOString(),
            challengeType: 'score'
        });

        console.log("Created Session:", sessionId);

        // 4. Create Scores
        // Score 1: ProGamer_X (Winner)
        await setDoc(doc(db, "scores", `${user.uid}_${sessionId}`), {
            sessionId,
            userId: user.uid,
            scoreValue: 125000,
            displayName: displayName,
            submittedAt: new Date().toISOString()
        });

        // Score 2: Fake User "NeonRider"
        const fakeUser1Id = "fake_user_1";
        await setDoc(doc(db, "scores", `${fakeUser1Id}_${sessionId}`), {
            sessionId,
            userId: fakeUser1Id,
            scoreValue: 89000,
            displayName: "NeonRider",
            submittedAt: new Date().toISOString()
        });

        // Score 3: Fake User "PixelQueen"
        const fakeUser2Id = "fake_user_2";
        await setDoc(doc(db, "scores", `${fakeUser2Id}_${sessionId}`), {
            sessionId,
            userId: fakeUser2Id,
            scoreValue: 45000,
            displayName: "PixelQueen",
            submittedAt: new Date().toISOString()
        });

        console.log("Seeded Scores!");
        console.log("Seed Complete. Exiting.");
        process.exit(0);

    } catch (error) {
        console.error("Error seeding:", error);
        process.exit(1);
    }
}

seed();
