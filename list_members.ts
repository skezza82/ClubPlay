
import { db } from './src/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function listMembers() {
    const clubId = "feeder-club-global-v1";
    const q = query(collection(db, "memberships"), where("clubId", "==", clubId));
    const snap = await getDocs(q);
    console.log(`Found ${snap.size} members in feeder-club-global-v1`);
    snap.docs.forEach(doc => {
        console.log(`id: ${doc.id}, userId: ${doc.data().userId}, name: ${doc.data().displayName}`);
    });
}
listMembers();
