const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, Timestamp, getDoc, updateDoc, increment, collection, query, where, getDocs } = require("firebase/firestore");

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
const clubId = 'retro-gaming-club';

async function setupTestData() {
    console.log(`Setting up test data for user ${userId} and club ${clubId}...`);

    try {
        // 1. Ensure user has a profile
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            console.log('Creating user profile...');
            await setDoc(userRef, {
                uid: userId,
                displayName: 'IamVengeance',
                displayNameLowercase: 'iamvengeance',
                photoURL: null,
                createdAt: new Date().toISOString(),
                xp: 100,
                friendsCount: 6,
                clubsJoined: 1
            });
        }

        // 2. Create Membership
        const membershipId = `${userId}_${clubId}`;
        const membershipRef = doc(db, 'memberships', membershipId);
        await setDoc(membershipRef, {
            clubId,
            userId,
            displayName: 'IamVengeance',
            role: 'member',
            joinedAt: new Date().toISOString()
        }, { merge: true });
        console.log('Membership created/updated');

        // 3. Update club member count
        const clubRef = doc(db, 'clubs', clubId);
        await setDoc(clubRef, {
            id: clubId,
            name: 'Retro Gaming Club',
            memberCount: increment(1),
            ownerId: 'some_owner_id', // placeholder if not exists
            createdAt: new Date().toISOString()
        }, { merge: true });
        console.log('Club updated');

        // 4. Ensure an active session exists
        const sessionsRef = collection(db, 'weekly_sessions');
        const q = query(sessionsRef, where('clubId', '==', clubId), where('isActive', '==', true));
        const sessionSnap = await getDocs(q);

        if (sessionSnap.empty) {
            console.log('Creating active session...');
            const newSessionRef = doc(sessionsRef);
            await setDoc(newSessionRef, {
                clubId,
                isActive: true,
                gameTitle: 'Super Mario Bros',
                gameId: 'super-mario-bros',
                platform: 'NES',
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                challengeType: 'score',
                startDate: Timestamp.now()
            });
            console.log('Active session created');
        } else {
            console.log('Active session already exists');
        }

        // 5. Add some mock scores to the session
        const activeSessions = await getDocs(q);
        const currentSession = activeSessions.docs[0];
        const sessionId = currentSession.id;

        const mockScores = [
            { name: 'IamVengeance', score: 250000, uid: userId },
            { name: 'skezza19', score: 180000, uid: '5VQtDbmp99YAZdCPTdiq4qY6Ia62' },
            { name: 'Holly', score: 154000, uid: 'mock_holly' },
            { name: 'Baz', score: 121000, uid: 'mock_baz' },
            { name: 'Dan', score: 98500, uid: 'mock_dan' }
        ];

        for (const s of mockScores) {
            await setDoc(doc(db, 'scores', `${s.uid}_${sessionId}`), {
                sessionId,
                userId: s.uid,
                scoreValue: s.score,
                displayName: s.name,
                submittedAt: Timestamp.now()
            }, { merge: true });
        }
        console.log('Mock scores added');

        console.log('All test data setup complete!');
        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err);
        process.exit(1);
    }
}

setupTestData();
