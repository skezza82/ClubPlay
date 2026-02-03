import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc,
    setDoc,
    addDoc,
    runTransaction,
    deleteDoc,
    writeBatch,
    Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

export interface Club {
    id: string;
    name: string;
    ownerId: string;
}

export interface Membership {
    clubId: string;
    userId: string;
    joinedAt: string;
    role: 'owner' | 'admin' | 'member';
    displayName?: string;
    photoURL?: string | null;
}

export interface ClubMember extends Membership {
    id: string;
}

export interface WeeklySession {
    id: string;
    clubId: string;
    gameId?: string;
    gameTitle?: string;
    platform?: string;
    rules?: string;
    isActive: boolean;
    endDate: string;
    challengeType: 'score' | 'speed';
}

export interface Score {
    userId: string;
    sessionId: string;
    scoreValue: number;
    displayName?: string;
}

export const getLatestClubMembership = async (userId: string) => {
    const membershipsRef = collection(db, "memberships");
    const q = query(
        membershipsRef,
        where("userId", "==", userId),
        orderBy("joinedAt", "desc"),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    return querySnapshot.docs[0].data() as Membership;
};

export const getActiveSession = async (clubId: string) => {
    const sessionsRef = collection(db, "weekly_sessions");
    const q = query(
        sessionsRef,
        where("clubId", "==", clubId),
        where("isActive", "==", true),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as WeeklySession;
};

export const getSessionLeader = async (sessionId: string) => {
    const scoresRef = collection(db, "scores");
    const q = query(
        scoresRef,
        where("sessionId", "==", sessionId),
        orderBy("scoreValue", "desc"),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const scoreData = querySnapshot.docs[0].data() as Score;

    // Optionally fetch the user's display name if not in score
    if (!scoreData.displayName) {
        const userDoc = await getDoc(doc(db, "users", scoreData.userId));
        if (userDoc.exists()) {
            scoreData.displayName = userDoc.data().displayName;
        }
    }

    return scoreData;
};

export const checkInviteCodeUnique = async (code: string) => {
    const clubsRef = collection(db, "clubs");
    const q = query(clubsRef, where("inviteCode", "==", code));
    const snapshot = await getDocs(q);
    return snapshot.empty;
};

export const createClub = async (
    name: string,
    inviteCode: string,
    ownerId: string,
    ownerDisplayName: string,
    ownerPhotoURL?: string,
    logoUrl?: string
) => {
    try {
        // Use a transaction to create club and membership atomically
        return await runTransaction(db, async (transaction) => {
            const clubRef = doc(collection(db, "clubs"));
            const clubId = clubRef.id;

            const newClub = {
                id: clubId,
                name,
                inviteCode,
                ownerId,
                memberCount: 1,
                logoUrl: logoUrl || null,
                createdAt: new Date().toISOString()
            };

            const membershipRef = doc(db, "memberships", `${ownerId}_${clubId}`);
            const newMembership = {
                clubId,
                userId: ownerId,
                displayName: ownerDisplayName,
                photoURL: ownerPhotoURL || null,
                role: 'owner',
                joinedAt: new Date().toISOString()
            };

            transaction.set(clubRef, newClub);
            transaction.set(membershipRef, newMembership);

            return clubId;
        });
    } catch (e) {
        console.error("Error creating club:", e);
        throw e;
    }
};

export const getClub = async (clubId: string) => {
    const docRef = doc(db, "clubs", clubId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Club & { logoUrl?: string, inviteCode: string };
};

export const getSessionScores = async (sessionId: string) => {
    const scoresRef = collection(db, "scores");
    // We remove the default sorting to allow flexible client-side sorting based on challengeType
    const q = query(
        scoresRef,
        where("sessionId", "==", sessionId),
        limit(100)
    );

    const snapshot = await getDocs(q);

    // Enrich with user data
    const scores = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let displayName = data.displayName;
        let photoURL = null;

        if (!displayName) {
            const userDoc = await getDoc(doc(db, "users", data.userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                displayName = userData.displayName;
                photoURL = userData.photoURL;
            }
        }

        return {
            id: docSnap.id,
            scoreValue: data.scoreValue || 0,
            userId: data.userId,
            displayName: displayName || "Unknown",
            photoURL: photoURL
        };
    }));

    return scores;
};

export const getSeasonStandings = async (clubId: string) => {
    // For now, we'll simulate season standings or read from a 'season_standings' collection
    // This collection would be updated by the weekly cron job
    const standingsRef = collection(db, "season_standings");
    const q = query(
        standingsRef,
        where("clubId", "==", clubId),
        orderBy("points", "desc")
    );

    const snapshot = await getDocs(q);

    const standings = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const userDoc = await getDoc(doc(db, "users", data.userId));
        const userData = userDoc.exists() ? userDoc.data() : {};

        return {
            id: docSnap.id,
            ...data,
            displayName: userData.displayName || "Unknown Member",
            photoURL: userData.photoURL
        };
    }));

    return standings;
};

export const getClubMembers = async (clubId: string) => {
    const q = query(
        collection(db, "memberships"),
        where("clubId", "==", clubId)
    );
    const snapshot = await getDocs(q);

    // Enrich with user data (displayName, photoUrl)
    const members = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const userDoc = await getDoc(doc(db, "users", data.userId));
        const userData = userDoc.exists() ? userDoc.data() : {};
        return {
            id: docSnap.id,
            ...data,
            displayName: userData.displayName || data.displayName || "Unknown User",
            photoURL: userData.photoURL || data.photoURL || null
        };
    }));

    return members as ClubMember[];
};

export const getJoinRequests = async (clubId: string) => {
    const q = query(
        collection(db, "join_requests"),
        where("clubId", "==", clubId),
        where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);

    // Enrich with user data
    const requests = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const userDoc = await getDoc(doc(db, "users", data.userId));
        const userData = userDoc.exists() ? userDoc.data() : {};
        return {
            id: docSnap.id,
            ...data,
            displayName: userData.displayName || data.displayName || "Unknown User",
            photoURL: userData.photoURL || data.photoURL || null,
            createdAt: data.createdAt
        };
    }));

    return requests;
};

export const updateClub = async (clubId: string, data: Partial<Club> & { logoUrl?: string }) => {
    const docRef = doc(db, "clubs", clubId);
    await setDoc(docRef, data, { merge: true });
};

export const respondToJoinRequest = async (requestId: string, clubId: string, userId: string, action: 'accepted' | 'rejected') => {
    // If accepted, creating membership and deleting request
    // If rejected, just delete request (or update status if we want history)

    const requestRef = doc(db, "join_requests", requestId);

    if (action === 'rejected') {
        // For now, just delete rejected requests to keep it clean
        // await deleteDoc(requestRef); 
        // Or update status:
        await setDoc(requestRef, { status: 'rejected' }, { merge: true });
        return;
    }

    if (action === 'accepted') {
        const membershipRef = doc(db, "memberships", `${userId}_${clubId}`);

        await runTransaction(db, async (transaction) => {
            // 1. READS FIRST
            const clubRef = doc(db, "clubs", clubId);
            const clubDoc = await transaction.get(clubRef);
            const requestDoc = await transaction.get(requestRef);

            const requestData = requestDoc.exists() ? requestDoc.data() : {};

            // 2. WRITES SECOND
            const newMembership = {
                clubId,
                userId,
                displayName: requestData.displayName || null,
                photoURL: requestData.photoURL || null,
                role: 'member',
                joinedAt: new Date().toISOString()
            };

            transaction.set(membershipRef, newMembership);
            transaction.update(requestRef, { status: 'accepted' });

            if (clubDoc.exists()) {
                const currentCount = clubDoc.data().memberCount || 0;
                transaction.update(clubRef, { memberCount: currentCount + 1 });
            }
        });
    }
};

export const getUserClubs = async (userId: string) => {
    const membershipsRef = collection(db, "memberships");
    const q = query(membershipsRef, where("userId", "==", userId));

    const snapshot = await getDocs(q);
    const memberships = snapshot.docs.map(doc => doc.data() as Membership & { role?: string });

    // Fetch details for each club
    const clubs = await Promise.all(memberships.map(async (membership) => {
        const clubDoc = await getDoc(doc(db, "clubs", membership.clubId));
        if (clubDoc.exists()) {
            return {
                id: clubDoc.id,
                ...clubDoc.data(),
                role: membership.role || 'member' // 'owner', 'admin', 'member'
            } as Club & { role: string, logoUrl?: string };
        }
        return null;
    }));

    return clubs.filter(c => c !== null) as (Club & { role: string, logoUrl?: string })[];
};

export const leaveClub = async (userId: string, clubId: string) => {
    // 1. Check if owner (cannot leave, must disband)
    // In a real app we might want to check this on server side or strictly enforce via rules
    // For now we check via UI, but here we just process the leave.

    // We need to find the membership ID. We constructed it as `${userId}_${clubId}` in createClub
    const membershipId = `${userId}_${clubId}`;
    const membershipRef = doc(db, "memberships", membershipId);

    await runTransaction(db, async (transaction) => {
        // 1. READS FIRST
        const memDoc = await transaction.get(membershipRef);
        const clubRef = doc(db, "clubs", clubId);
        const clubDoc = await transaction.get(clubRef);

        // 2. LOGIC & CHECKS
        if (!memDoc.exists()) throw new Error("Membership not found");

        if (memDoc.data().role === 'owner') {
            throw new Error("Owners cannot leave the club. Disband the club instead.");
        }

        // 3. WRITES LAST
        transaction.delete(membershipRef);

        if (clubDoc.exists()) {
            const currentCount = clubDoc.data().memberCount || 1;
            transaction.update(clubRef, { memberCount: Math.max(0, currentCount - 1) });
        }
    });
};

export const disbandClub = async (clubId: string) => {
    // 1. Delete Club Doc
    await deleteDoc(doc(db, "clubs", clubId));

    // 2. Cleanup Memberships and Join Requests using batches
    const batch = writeBatch(db);

    const membershipsQ = query(collection(db, "memberships"), where("clubId", "==", clubId));
    const memSnap = await getDocs(membershipsQ);
    memSnap.docs.forEach(d => batch.delete(d.ref));

    const reqQ = query(collection(db, "join_requests"), where("clubId", "==", clubId));
    const reqSnap = await getDocs(reqQ);
    reqSnap.docs.forEach(d => batch.delete(d.ref));

    await batch.commit();
};

export const submitScore = async (sessionId: string, userId: string, scoreValue: number, displayName: string) => {
    // We use a composite ID to ensure one score per user per session
    const scoreId = `${userId}_${sessionId}`;
    const scoreRef = doc(db, "scores", scoreId);

    await setDoc(scoreRef, {
        sessionId,
        userId,
        scoreValue,
        displayName,
        submittedAt: Timestamp.now()
    }, { merge: true }); // Merge true allows updating the score if it already exists
};

export const updateMemberRole = async (clubId: string, userId: string, newRole: 'admin' | 'member') => {
    const membershipId = `${userId}_${clubId}`;
    const membershipRef = doc(db, "memberships", membershipId);
    await setDoc(membershipRef, { role: newRole }, { merge: true });
};

export const createManualSession = async (clubId: string, details: { title: string, platform: string, rules: string, endDate: string, challengeType: 'score' | 'speed' }) => {
    // 1. Deactivate current sessions
    const sessionsRef = collection(db, "weekly_sessions");
    const q = query(sessionsRef, where("clubId", "==", clubId), where("isActive", "==", true));
    const snap = await getDocs(q);

    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { isActive: false }));

    // 2. Create new session
    const newSessionRef = doc(collection(db, "weekly_sessions"));

    batch.set(newSessionRef, {
        clubId,
        gameTitle: details.title,
        platform: details.platform,
        rules: details.rules,
        isActive: true,
        startDate: Timestamp.now(),
        endDate: details.endDate,
        challengeType: details.challengeType
    });

    await batch.commit();
    return newSessionRef.id;
};

export const updateSession = async (sessionId: string, details: Partial<WeeklySession>) => {
    const docRef = doc(db, "weekly_sessions", sessionId);
    await setDoc(docRef, details, { merge: true });
};

export const getAllClubs = async () => {
    const clubsRef = collection(db, "clubs");
    const q = query(clubsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const requestJoin = async (clubId: string, userId: string, displayName: string, photoURL?: string) => {
    const requestId = `${userId}_${clubId}`;
    const requestRef = doc(db, "join_requests", requestId);

    await setDoc(requestRef, {
        clubId,
        userId,
        displayName,
        photoURL: photoURL || null,
        status: 'pending',
        createdAt: new Date().toISOString()
    });
    return requestId;
};

export const checkPendingRequest = async (userId: string, clubId: string) => {
    const requestId = `${userId}_${clubId}`;
    const requestRef = doc(db, "join_requests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (requestSnap.exists() && requestSnap.data().status === 'pending') {
        return true;
    }
    return false;
};
