const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, writeBatch, serverTimestamp, increment } = require("firebase/firestore");

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

const SOURCE_UID = '5VQtDbmp99YAZdCPTdiq4qY6Ia62'; // skezza19@gmail.com
const TARGET_UID = 'X9RgGptWKmZNHa4gKLt3b5e1rTF2'; // brucewayne@waynemail.com

async function cloneFriends() {
    console.log(`Cloning friends from ${SOURCE_UID} to ${TARGET_UID}...`);

    try {
        // 1. Get source friends
        const sourceFriendsRef = collection(db, 'users', SOURCE_UID, 'friends');
        const sourceFriendsSnapshot = await getDocs(sourceFriendsRef);

        if (sourceFriendsSnapshot.empty) {
            console.log('Source user has no friends.');
            process.exit(0);
        }

        console.log(`Found ${sourceFriendsSnapshot.size} friends.`);

        const batch = writeBatch(db);
        const targetFriendsRef = collection(db, 'users', TARGET_UID, 'friends');

        for (const docSnap of sourceFriendsSnapshot.docs) {
            const friendId = docSnap.id;
            const friendData = docSnap.data();

            // Add friend to target's list
            batch.set(doc(db, 'users', TARGET_UID, 'friends', friendId), {
                ...friendData,
                addedAt: serverTimestamp()
            });

            // Also make it mutual: add target to friend's list
            batch.set(doc(db, 'users', friendId, 'friends', TARGET_UID), {
                friendId: TARGET_UID,
                addedAt: serverTimestamp()
            });

            console.log(`Adding friendship with ${friendId}`);
        }

        // Also update friendsCount if it's cached on the user doc
        const targetUserRef = doc(db, 'users', TARGET_UID);
        batch.set(targetUserRef, {
            friendsCount: sourceFriendsSnapshot.size
        }, { merge: true });

        await batch.commit();
        console.log('Successfully cloned friends.');
        process.exit(0);
    } catch (error) {
        console.error('Error cloning friends:', error);
        process.exit(1);
    }
}

cloneFriends();
