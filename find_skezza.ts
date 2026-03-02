
import { db } from './src/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function findSkezza() {
    const q = query(collection(db, "users"), where("displayName", "==", "skezza82"));
    const snap = await getDocs(q);
    if (snap.empty) {
        const q2 = query(collection(db, "users"), where("displayName", "==", "Skezza82"));
        const snap2 = await getDocs(q2);
        if (snap2.empty) {
            console.log("Not found with skezza82 or Skezza82");
            return;
        }
        console.log("Found Skezza82:", snap2.docs[0].id);
    } else {
        console.log("Found skezza82:", snap.docs[0].id);
    }
}
findSkezza();
