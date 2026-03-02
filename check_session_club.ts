import { db } from './src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function checkSession() {
    const sessionId = "feeder-club-6-month-pacman";
    const docRef = doc(db, "weekly_sessions", sessionId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        console.log("CLUB ID FOR SESSION:", snap.data().clubId);
    } else {
        console.log("SESSION NOT FOUND");
    }
}

checkSession().catch(e => console.error(e));
