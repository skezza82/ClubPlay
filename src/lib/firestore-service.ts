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
    updateDoc,
    addDoc,
    runTransaction,
    deleteDoc,
    writeBatch,
    Timestamp,
    onSnapshot,
    QuerySnapshot,
    increment,
    serverTimestamp
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
    challengeType: 'score' | 'speed' | 'custom';
    customUnit?: string;
    cover_image_url?: string;
    isProcessed?: boolean;
}

export interface ClubStanding {
    id: string; // userId
    clubId: string;
    userId: string;
    points: number;
    displayName: string;
    photoURL?: string | null;
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

export const getActiveSessions = async (clubId: string) => {
    const sessionsRef = collection(db, "weekly_sessions");
    // Sort client-side to avoid index propagation delays/issues with composite queries
    const q = query(
        sessionsRef,
        where("clubId", "==", clubId),
        where("isActive", "==", true)
    );

    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WeeklySession[];

    // Sort by endDate ascending
    return sessions.sort((a, b) => a.endDate.localeCompare(b.endDate));
};
// Keep for backward compat temporarily, but return first
export const getActiveSession = async (clubId: string) => {
    const sessions = await getActiveSessions(clubId);
    return sessions.length > 0 ? sessions[0] : null;
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

export const getPastSessions = async (clubId: string, limitCount: number = 3) => {
    const sessionsRef = collection(db, "weekly_sessions");
    const q = query(
        sessionsRef,
        where("clubId", "==", clubId),
        where("isActive", "==", false),
        orderBy("endDate", "desc"),
        limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WeeklySession[];
};

export const checkInviteCodeUnique = async (code: string) => {
    const clubsRef = collection(db, "clubs");
    const q = query(clubsRef, where("inviteCode", "==", code));
    const snapshot = await getDocs(q);
    return snapshot.empty;
};


export const endSessionEarly = async (sessionId: string) => {
    const docRef = doc(db, "weekly_sessions", sessionId);
    await updateDoc(docRef, {
        isActive: false,
        endDate: new Date().toISOString()
    });
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

export const updateClubStandings = async (clubId: string, updates: { userId: string, pointsToAdd: number }[]) => {
    const batch = writeBatch(db);

    for (const update of updates) {
        // We use a composite key of clubId_userId for unique standings per club
        const standingId = `${clubId}_${update.userId}`;
        const standingRef = doc(db, "season_standings", standingId);

        // This is a bit tricky because we need to read current points to add to them.
        // For atomic updates without reading inside a loop (which is slow/complex in batch),
        // we might ideally use increment().
        // Let's use Firestore's increment operator for efficiency.

        // However, we strictly need user details if creating new doc.
        // Assuming the doc might not exist, set with merge is good, 
        // but we need to supply basic info if it's new.
        // For simplicity in this iteration, we trust the increment works on fields even if doc is created?
        // No, set with merge: true and increment works.



        // We need to fetch user details if we want to store them in standing doc
        // BUT, keeping standings lightweight and just storing ID + points is better,
        // joining with users table on read.
        // The current `getSeasonStandings` joins on read. So we just store points.

        batch.set(standingRef, {
            clubId,
            userId: update.userId,
            points: increment(update.pointsToAdd)
        }, { merge: true });
    }

    await batch.commit();
};

export const markSessionProcessed = async (sessionId: string) => {
    const sessionRef = doc(db, "weekly_sessions", sessionId);
    await updateDoc(sessionRef, { isProcessed: true });
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

export const createManualSession = async (clubId: string, details: { title: string, platform: string, rules: string, endDate: string, challengeType: 'score' | 'speed' | 'custom', customUnit?: string, cover_image_url?: string }) => {
    // 1. Check current sessions count
    const sessionsRef = collection(db, "weekly_sessions");
    const q = query(sessionsRef, where("clubId", "==", clubId), where("isActive", "==", true));
    const snap = await getDocs(q);

    if (snap.size >= 3) {
        throw new Error("Maximum of 3 active challenges allowed. Please end a challenge before starting a new one.");
    }

    const batch = writeBatch(db);
    // snap.docs.forEach(d => batch.update(d.ref, { isActive: false })); // REMOVED: Do not deactivate others

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
        challengeType: details.challengeType,
        customUnit: details.customUnit || null,
        cover_image_url: details.cover_image_url || null
    });

    await batch.commit();
    return newSessionRef.id;
};

export const updateSession = async (sessionId: string, details: Partial<WeeklySession>) => {
    const docRef = doc(db, "weekly_sessions", sessionId);
    await updateDoc(docRef, details);
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

// Score Management
export const deleteScore = async (scoreId: string) => {
    const scoreRef = doc(db, "scores", scoreId);
    await deleteDoc(scoreRef);
};

export const updateScore = async (scoreId: string, newValue: number) => {
    const scoreRef = doc(db, "scores", scoreId);
    await updateDoc(scoreRef, { scoreValue: newValue });
};

// Chat Service
export interface Message {
    id: string;
    text: string;
    userId: string;
    displayName: string;
    photoURL?: string;
    createdAt: string; // ISO string
    clubId: string;
}

export const subscribeToClubMessages = (clubId: string, callback: (messages: Message[]) => void) => {
    const messagesRef = collection(db, "clubs", clubId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(50));

    return onSnapshot(q, (snapshot: QuerySnapshot) => {
        const messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        } as Message));
        callback(messages);
    }, (error) => {
        console.error("Error subscribing to messages:", error);
    });
};

export const sendClubMessage = async (clubId: string, userId: string, text: string, userProfile: { displayName: string, photoURL?: string }) => {
    const messagesRef = collection(db, "clubs", clubId, "messages");
    await addDoc(messagesRef, {
        text,
        userId,
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL || null,
        createdAt: new Date().toISOString(),
        clubId
    });
};

export const processSessionResults = async (sessionId: string, clubId: string) => {
    // 1. Fetch scores for the session
    const scores = await getSessionScores(sessionId);

    if (scores.length === 0) {
        // Just mark processed
        await markSessionProcessed(sessionId);
        return 0;
    }

    // 1.5 Fetch session to check challenge type
    const sessionDocRef = doc(db, "weekly_sessions", sessionId);
    const sessionDoc = await getDoc(sessionDocRef);
    if (!sessionDoc.exists()) throw new Error("Session not found");
    const sessionData = sessionDoc.data() as WeeklySession;

    // 2. Sort scores
    const sortedScores = [...scores].sort((a, b) => {
        if (sessionData.challengeType === 'speed') {
            return a.scoreValue - b.scoreValue; // Lower is better for speed
        }
        return b.scoreValue - a.scoreValue; // Higher is better for score
    });

    // 3. Calculate points
    const updates: { userId: string, pointsToAdd: number }[] = [];

    sortedScores.forEach((score, index) => {
        let points = 25;
        if (index === 0) points = 100;
        else if (index === 1) points = 75;
        else if (index === 2) points = 50;

        updates.push({
            userId: score.userId,
            pointsToAdd: points
        });
    });

    // 4. Update Standings
    await updateClubStandings(clubId, updates);

    // 5. Mark Session Processed & Inactive
    const sessionRef = doc(db, "weekly_sessions", sessionId);
    await updateDoc(sessionRef, {
        isProcessed: true,
        isActive: false,
        endDate: new Date().toISOString()
    });

    return updates.length;
};

export const deleteSession = async (sessionId: string) => {
    try {
        await deleteDoc(doc(db, "weekly_sessions", sessionId));
        // Optional: We could also delete associated scores here if we wanted a "hard" delete
        // const scoresQuery = query(collection(db, "scores"), where("sessionId", "==", sessionId));
        // const batch = writeBatch(db); ...
        return true;
    } catch (error) {
        console.error("Error deleting session:", error);
        throw error;
    }
};



export const updateLastVisitedClub = async (userId: string, clubId: string) => {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { lastVisitedClubId: clubId }, { merge: true });
};

export const fixMembership = async (userId: string, clubId: string, displayName: string) => {
    const membershipId = `${userId}_${clubId}`;
    const membershipRef = doc(db, "memberships", membershipId);
    await setDoc(membershipRef, {
        clubId,
        userId,
        role: 'member',
        displayName: displayName || "Fixed Member",
        joinedAt: new Date().toISOString()
    }, { merge: true });

    // Increment member count just in case
    // Note: This might double count if we aren't careful, but for a repair tool it's okay
    // We'll skip updating member count to avoid issues, just fixing the permission doc is enough
};
