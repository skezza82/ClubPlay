
import { db } from './src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function checkMember() {
    const membershipId = "5VQtDbmp99YAZdCPTdiq4qY6Ia62_feeder-club-global-v1";
    const ref = doc(db, "memberships", membershipId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        console.log("Member exists in feeder club:", JSON.stringify(snap.data(), null, 2));
    } else {
        console.log("Member does NOT exist in feeder club!");
    }
}
checkMember();
