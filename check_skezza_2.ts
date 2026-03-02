
import { db } from './src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function checkSkezza() {
    const ref = doc(db, "users", "5VQtDbmp99YAZdCPTdiq4qY6Ia62");
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const data = snap.data();
        console.log("displayName:", data.displayName);
        console.log("displayNameLowercase:", data.displayNameLowercase);
        console.log("role:", data.role);
    } else {
        console.log("Skezza doc not found!");
    }
}
checkSkezza();
