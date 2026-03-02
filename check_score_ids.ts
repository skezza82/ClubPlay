import { db } from './src/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function checkSkezzaScores() {
    const userId = "5VQtDbmp99YAZdCPTdiq4qY6Ia62";
    const q = query(collection(db, "scores"), where("userId", "==", userId), where("sessionId", "==", "feeder-club-6-month-pacman"));
    const snap = await getDocs(q);
    console.log(`Found ${snap.size} scores for skezza82 in the pacman session`);
    snap.forEach(d => {
        console.log(`ID: ${d.id}, DATA:`, JSON.stringify(d.data(), null, 2));
    });
}

checkSkezzaScores().catch(e => console.error(e));
