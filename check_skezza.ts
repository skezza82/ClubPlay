
import { db } from './src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function checkSkezza() {
    const ref = doc(db, "users", "5VQtDbmp99YAZdCPTdiq4qY6Ia62");
    const snap = await getDoc(ref);
    if (snap.exists()) {
        console.log("Skezza data:", JSON.stringify(snap.data(), null, 2));
    } else {
        console.log("Skezza doc not found!");
    }
}
checkSkezza();
