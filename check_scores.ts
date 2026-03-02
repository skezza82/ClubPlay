import { db } from './src/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function checkSkezzaScores() {
    const userId = "5VQtDbmp99YAZdCPTdiq4qY6Ia62";
    const q = query(collection(db, "scores"), where("userId", "==", userId));
    const snap = await getDocs(q);
    console.log(`Found ${snap.size} scores for skezza82`);
    snap.forEach(d => {
        console.log(`SESSION: ${d.data().sessionId}, SCORE: ${d.data().scoreValue}, STATUS: ${d.data().status}`);
    });
}

checkSkezzaScores().catch(e => console.error(e));
