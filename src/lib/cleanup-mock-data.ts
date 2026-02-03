import {
    deleteDoc,
    doc,
    collection,
    getDocs,
    query,
    where,
    writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

export const cleanupMockData = async () => {
    console.log("Starting cleanup of mock data...");

    const batch = writeBatch(db);

    // 1. Delete specific known mock IDs
    const mockClubs = ["club-1"];
    const mockSessions = ["sess-1"];
    const mockScores = ["sc-1"];

    for (const id of mockClubs) {
        batch.delete(doc(db, "clubs", id));
    }
    for (const id of mockSessions) {
        batch.delete(doc(db, "weekly_sessions", id));
    }
    for (const id of mockScores) {
        batch.delete(doc(db, "scores", id));
    }

    // 2. Delete any clubs owned by 'user-1' (the mock owner)
    const q = query(collection(db, "clubs"), where("ownerId", "==", "user-1"));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => batch.delete(d.ref));

    // 3. Delete any memberships associated with mock clubs or mock user
    const memQ = query(collection(db, "memberships"), where("userId", "==", "user-1"));
    const memSnap = await getDocs(memQ);
    memSnap.docs.forEach(d => batch.delete(d.ref));

    // Also memberships where clubId is club-1
    const memQ2 = query(collection(db, "memberships"), where("clubId", "==", "club-1"));
    const memSnap2 = await getDocs(memQ2);
    memSnap2.docs.forEach(d => batch.delete(d.ref));

    await batch.commit();
    console.log("Cleanup complete!");
};
