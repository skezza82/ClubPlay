import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    doc,
    getDoc,
    updateDoc,
    increment,
    setDoc,
    writeBatch,
    addDoc,
    deleteDoc,
    runTransaction,
    onSnapshot,
    QuerySnapshot,
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { updateProfile } from "firebase/auth";

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("displayNameLowercase", "==", username.toLowerCase()));
    const snapshot = await getDocs(q);
    return snapshot.empty;
};

export const findUserByUsername = async (username: string) => {
    const usersRef = collection(db, "users");
    // Try lowercase first
    const q = query(usersRef, where("displayNameLowercase", "==", username.toLowerCase()), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
    }

    // Fallback: Try exact match on displayName for legacy accounts
    const q2 = query(usersRef, where("displayName", "==", username), limit(1));
    const snapshot2 = await getDocs(q2);

    if (!snapshot2.empty) {
        return { uid: snapshot2.docs[0].id, ...snapshot2.docs[0].data() } as any;
    }

    return null;
};

export interface Club {
    id: string;
    name: string;
    bio?: string;
    ownerId: string;
    memberCount: number;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    inviteCode: string;
    latestWinnerId?: string | null;
    latestWinnerName?: string | null;
    createdAt: string;
    isHidden?: boolean;
    chatEnabled?: boolean;
}

export interface Membership {
    clubId: string;
    userId: string;
    joinedAt: string;
    role: 'owner' | 'admin' | 'member';
    displayName?: string;
    photoURL?: string | null;
    xp?: number;
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
    startDate?: any;
}

export interface ClubStanding {
    id: string; // userId
    clubId: string;
    userId: string;
    points: number;
    wins: number;
    displayName: string;
    photoURL?: string | null;
    xp?: number;
}

export interface Score {
    userId: string;
    sessionId: string;
    scoreValue: number;
    displayName?: string;
    photoURL?: string | null;
    xp?: number;
    submittedAt?: any;
}

export interface FriendRequest {
    id: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string | null;
    senderXp?: number;
    receiverId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export interface UserPublicProfile {
    uid: string;
    displayName: string;
    photoURL?: string | null;
    clubsJoined: number;
    challengesCount: number;
    wins: number;
    friendsCount: number;
    currentChallenge?: string | null;
    mainClub?: {
        id: string;
        name: string;
        rank: number;
        totalMembers: number;
    } | null;
    xp: number;
    clubs: (Club & { role: string, logoUrl?: string })[];
}

export interface GOTM {
    id: string;
    clubId: string;
    title: string;
    platform: string;
    year?: string;
    developer?: string;
    publisher?: string;
    coverUrl?: string;
    description?: string;
    startDate: string; // ISO
    endDate: string; // ISO
    genre?: string;
    igdbId?: string;
}

export interface GOTMReview {
    id: string;
    gotmId: string;
    userId: string;
    displayName: string;
    photoURL?: string;
    reviewText: string;
    ratings: {
        graphics: number;
        sound: number;
        gameplay: number;
        story: number;
        replayability: number;
    };
    recommend: boolean;
    completed: boolean;
    createdAt: string;
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

export const getClubSessions = async (clubId: string) => {
    const sessionsRef = collection(db, "weekly_sessions");
    const q = query(sessionsRef, where("clubId", "==", clubId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WeeklySession[];
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

    const docSnap = querySnapshot.docs[0];
    const scoreData = docSnap.data();

    // Fetch the user's latest profile
    const userDoc = await getDoc(doc(db, "users", scoreData.userId));
    let displayName = scoreData.displayName;
    let photoURL = scoreData.photoURL;
    let xp = scoreData.xp;

    if (userDoc.exists()) {
        const userData = userDoc.data();
        displayName = userData.displayName || displayName;
        photoURL = userData.photoURL || photoURL;
        xp = userData.xp || xp;
    }

    return {
        id: docSnap.id,
        userId: scoreData.userId,
        sessionId: scoreData.sessionId,
        scoreValue: scoreData.scoreValue,
        displayName: displayName || "Unknown",
        photoURL: photoURL,
        xp: xp || 0,
        submittedAt: scoreData.submittedAt
    } as Score;
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
    logoUrl?: string,
    bannerUrl?: string,
    bio?: string
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
                bannerUrl: bannerUrl || null,
                bio: bio || "",
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

            // Award XP to creator (100 XP)
            const userRef = doc(db, "users", ownerId);
            transaction.update(userRef, { xp: increment(100) });

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

        // Always try to fetch latest user profile to ensure names match everywhere
        const userDoc = await getDoc(doc(db, "users", data.userId));
        let displayName = data.displayName;
        let photoURL = null;

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.displayName && userData.displayName !== "Unknown") {
                displayName = userData.displayName;
            }
            photoURL = userData.photoURL;
        }

        return {
            id: docSnap.id,
            scoreValue: data.scoreValue || 0,
            userId: data.userId,
            displayName: displayName || "Unknown",
            photoURL: photoURL,
            xp: userDoc.exists() ? userDoc.data().xp : 0,
            submittedAt: data.submittedAt
        };
    }));

    return scores;
};

export const getClubSessionScores = getSessionScores;

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

        // Helper to check if a name is "real"
        const isValidName = (name: string) => name && name !== "Unknown" && name !== "Unknown Member" && name !== "Unknown User";

        const userDisplayName = isValidName(userData.displayName) ? userData.displayName : null;
        const storedDisplayName = isValidName(data.displayName) ? data.displayName : null;

        return {
            id: docSnap.id,
            ...data,
            displayName: userDisplayName || storedDisplayName || "Unknown Member",
            photoURL: userData.photoURL,
            xp: userData.xp || 0
        };
    }));

    return standings;
};

export const updateClubStandings = async (clubId: string, updates: { userId: string, pointsToAdd: number, isWinner?: boolean, displayName?: string }[]) => {
    const batch = writeBatch(db);

    for (const update of updates) {
        const standingId = `${clubId}_${update.userId}`;
        const standingRef = doc(db, "season_standings", standingId);

        const data: any = {
            clubId,
            userId: update.userId,
            points: increment(update.pointsToAdd)
        };

        if (update.displayName) {
            data.displayName = update.displayName;
        }

        if (update.isWinner) {
            data.wins = increment(1);
        }

        batch.set(standingRef, data, { merge: true });
    }

    await batch.commit();
};

export const updateMemberStats = async (clubId: string, userId: string, stats: { wins?: number, points?: number }) => {
    const standingId = `${clubId}_${userId}`;
    const standingRef = doc(db, "season_standings", standingId);

    const data: any = { clubId, userId };
    if (stats.wins !== undefined) data.wins = stats.wins;
    if (stats.points !== undefined) data.points = stats.points;

    await setDoc(standingRef, data, { merge: true });
};

export const migrateLeaderboardNames = async (clubId: string) => {
    let count = 0;
    const batch = writeBatch(db);

    // Helper to pick best name
    const resolveName = (userData: any) => {
        if (userData.displayName && userData.displayName !== "Unknown" && userData.displayName !== "Unknown Member" && userData.displayName !== "Unknown User") {
            return userData.displayName;
        }
        if (userData.email) {
            return userData.email.split('@')[0];
        }
        return "Unknown";
    };

    // 1. Fix Season Standings
    const standingsRef = collection(db, "season_standings");
    const q = query(standingsRef, where("clubId", "==", clubId));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
        // Always try to improve the name
        const data = docSnap.data();
        if (data.userId) {
            const userDoc = await getDoc(doc(db, "users", data.userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const newName = resolveName(userData);
                // Only update if it's different and meaningful
                if (newName !== "Unknown" && newName !== data.displayName) {
                    batch.update(docSnap.ref, { displayName: newName });
                    count++;
                }
            }
        }
    }

    // 2. Fix Session Scores
    const sessionsRef = collection(db, "weekly_sessions");
    const sessionsQ = query(sessionsRef, where("clubId", "==", clubId));
    const sessionsSnap = await getDocs(sessionsQ);

    for (const sessionDoc of sessionsSnap.docs) {
        const scoresRef = collection(db, "scores");
        const scoresQ = query(scoresRef, where("sessionId", "==", sessionDoc.id));
        const scoresSnap = await getDocs(scoresQ);

        for (const scoreSnap of scoresSnap.docs) {
            const data = scoreSnap.data();
            if (data.userId) {
                const userDoc = await getDoc(doc(db, "users", data.userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const newName = resolveName(userData);
                    if (newName !== "Unknown" && newName !== data.displayName) {
                        batch.update(scoreSnap.ref, { displayName: newName });
                        count++;
                    }
                }
            }
        }
    }

    if (count > 0) {
        await batch.commit();
    }
    return count;
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
            photoURL: userData.photoURL || data.photoURL || null,
            xp: userData.xp || 0
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
            xp: userData.xp || 0,
            createdAt: data.createdAt
        };
    }));

    return requests;
};

export const subscribeToJoinRequests = (clubId: string, callback: (requests: any[]) => void) => {
    const q = query(
        collection(db, "join_requests"),
        where("clubId", "==", clubId),
        where("status", "==", "pending")
    );

    return onSnapshot(q, (snapshot) => {
        // Simple map first to get IDs, enrichment can happen in callback or here
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(requests);
    });
};

export const updateClub = async (clubId: string, data: Partial<Club> & { logoUrl?: string, bannerUrl?: string }) => {
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

            // XP Rewards
            // New Member: 50 XP
            // Club Owner: 10 XP
            const memberRef = doc(db, "users", userId);
            transaction.update(memberRef, { xp: increment(50) });

            if (clubDoc.exists()) {
                const ownerId = clubDoc.data().ownerId;
                if (ownerId && ownerId !== userId) {
                    const ownerRef = doc(db, "users", ownerId);
                    transaction.update(ownerRef, { xp: increment(10) });
                }
            }
        });
    }
};

// XP System
/**
 * Calculates level based on a quadratic curve:
 * L1: 0 XP
 * L2: 1000 XP (needs 1000)
 * L3: 3000 XP (needs 2000 more)
 * L4: 6000 XP (needs 3000 more)
 * Formula for cumulative XP to reach level L: 500 * L * (L-1)
 */
export const getXpLevel = (xp: number) => {
    if (!xp || xp < 1000) return 1;
    // Reverse of 500 * L * (L-1)
    // L = (1 + sqrt(1 + 4*XP/500)) / 2
    return Math.floor((1 + Math.sqrt(1 + xp / 125)) / 2);
};

export const getXpProgress = (xp: number) => {
    const currentXp = xp || 0;
    const level = getXpLevel(currentXp);

    const xpToReachCurrent = 500 * level * (level - 1);
    const xpToReachNext = 500 * (level + 1) * level;

    const progressInLevel = currentXp - xpToReachCurrent;
    const neededForNext = xpToReachNext - xpToReachCurrent; // This will be 1000 * level

    return {
        current: progressInLevel,
        needed: neededForNext,
        percentage: Math.min(100, (progressInLevel / neededForNext) * 100)
    };
};

export const addXp = async (userId: string, amount: number, source: string) => {
    if (!userId) return;
    try {
        const userRef = doc(db, "users", userId);
        // Use setDoc with merge instead of updateDoc to handle missing documents
        await setDoc(userRef, {
            xp: increment(amount),
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`[XP] Awarded ${amount} XP to ${userId} for ${source}`);
    } catch (e) {
        console.error("Error awarding XP:", e);
        throw e; // Re-throw to let UI handle it
    }
};

export const setXp = async (userId: string, amount: number) => {
    if (!userId) return;
    try {
        const userRef = doc(db, "users", userId);
        // Use setDoc with merge instead of updateDoc
        await setDoc(userRef, {
            xp: amount,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`[XP] Manually set XP to ${amount} for ${userId}`);
    } catch (e) {
        console.error("Error setting XP:", e);
        throw e; // Re-throw to let UI handle it
    }
};

export const calculateRetroactiveXp = async (userId: string) => {
    // 1. Get wins from season_standings
    const standingsRef = collection(db, "season_standings");
    const qStandings = query(standingsRef, where("userId", "==", userId));
    const standingsSnap = await getDocs(qStandings);

    let totalWins = 0;
    let foundDisplayName: string | null = null;
    standingsSnap.forEach(d => {
        const data = d.data();
        totalWins += data.wins || 0;
        if (!foundDisplayName && data.displayName) foundDisplayName = data.displayName;
    });

    // 2. Get true participation count from scores (one per session)
    const scoresRef = collection(db, "scores");
    const qScores = query(scoresRef, where("userId", "==", userId));
    const scoresSnap = await getDocs(qScores);
    const totalParticipation = scoresSnap.size;
    scoresSnap.forEach(d => {
        const data = d.data();
        if (!foundDisplayName && data.displayName) foundDisplayName = data.displayName;
    });

    // 3. Get clubs joined
    const clubs = await getUserClubs(userId);
    const clubsCount = clubs.length;
    // Note: Membership interface has displayName
    clubs.forEach((c: any) => {
        if (!foundDisplayName && c.displayName) foundDisplayName = c.displayName;
    });

    // 4. Get friends count
    const friendsSnap = await getDocs(query(collection(db, "users", userId, "friends"), limit(500)));
    const friendsCount = friendsSnap.size;

    // 5. Calculate extra XP for owned clubs (100 total vs 50 for regular members)
    const ownedClubsCount = clubs.filter(c => c.role === 'owner').length;

    // Calculation Logic:
    // 500 XP per Win
    // 100 XP per Participation (Distinct Session Score)
    // 50 XP per Club Joined
    // 50 XP Bonus per Club Created (Owner)
    // 25 XP per Friend
    const calculatedXp = (totalWins * 500) + (totalParticipation * 100) + (clubsCount * 50) + (ownedClubsCount * 50) + (friendsCount * 25);

    return {
        totalXp: calculatedXp,
        bestDisplayName: foundDisplayName,
        breakdown: {
            wins: totalWins,
            participation: totalParticipation,
            clubs: clubsCount,
            friends: friendsCount,
            ownedClubs: ownedClubsCount
        }
    };
};

export const syncRetroactiveXp = async (userId: string) => {
    if (!userId) return 0;
    const { totalXp, bestDisplayName } = await calculateRetroactiveXp(userId);

    // Use setDoc with merge to ensure the user document exists and has a name if possible
    const userRef = doc(db, "users", userId);
    const updateData: any = { xp: totalXp };
    if (bestDisplayName) {
        updateData.displayName = bestDisplayName;
        updateData.displayNameLowercase = (bestDisplayName as string).toLowerCase();
    }

    await setDoc(userRef, updateData, { merge: true });
    return totalXp;
};

export const bulkSyncAllUsersXp = async () => {
    try {
        // We iterate through MEMBERSHIPS instead of users to find players who may lack a user profile document
        const membershipsRef = collection(db, "memberships");
        const snapshot = await getDocs(membershipsRef);
        console.log(`[Bulk XP Sync] Scanning ${snapshot.size} memberships...`);

        const uniqueUserIds = new Set<string>();
        snapshot.docs.forEach(d => {
            const uid = d.data().userId;
            if (uid) uniqueUserIds.add(uid);
        });

        // Also check scores for users who might not be in a club anymore
        const scoresRef = collection(db, "scores");
        const scoresSnap = await getDocs(query(scoresRef, limit(1000)));
        scoresSnap.docs.forEach(d => {
            const uid = d.data().userId;
            if (uid) uniqueUserIds.add(uid);
        });

        console.log(`[Bulk XP Sync] Starting sync for ${uniqueUserIds.size} unique players...`);

        let count = 0;
        const uids = Array.from(uniqueUserIds);
        for (const userId of uids) {
            try {
                await syncRetroactiveXp(userId);
                count++;
                if (count % 5 === 0) console.log(`[Bulk XP Sync] ${count}/${uniqueUserIds.size} complete...`);
            } catch (userErr) {
                console.error(`[Bulk XP Sync] Failed for ${userId}:`, userErr);
            }
        }

        return count;
    } catch (e) {
        console.error("Bulk XP Sync failed:", e);
        throw e;
    }
};

// User Management
export const updateUserProfile = async (userId: string, data: { displayName?: string, photoURL?: string }) => {
    const userRef = doc(db, "users", userId);

    // Generate search keywords for case-insensitive indexing
    const updateData: any = { ...data };
    if (data.displayName) {
        const name = data.displayName;
        updateData.displayNameLowercase = name.toLowerCase();

        const parts = name.toLowerCase().split(/\s+/);
        const keywords = new Set<string>();
        parts.forEach(p => {
            if (p.length > 1) keywords.add(p);
        });
        keywords.add(name.toLowerCase());
        updateData.searchKeywords = Array.from(keywords);
    }

    await setDoc(userRef, updateData, { merge: true });

    // Also update Auth profile if current user
    if (auth.currentUser && auth.currentUser.uid === userId) {
        const { updateProfile } = await import("firebase/auth");
        await updateProfile(auth.currentUser, {
            displayName: data.displayName || auth.currentUser.displayName,
            photoURL: data.photoURL || auth.currentUser.photoURL
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

    console.log(`[getUserClubs] Found ${memberships.length} memberships for user ${userId}`);
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

    // Check if this is the FIRST score for this session to award bonus XP
    // Note: This is an optimistic check. Race conditions might occur but acceptable for XP.
    const scoresRef = collection(db, "scores");
    const q = query(scoresRef, where("sessionId", "==", sessionId), limit(2)); // Check if more than 1 (ours + maybe another)
    const snap = await getDocs(q);

    // If only 1 score exists (ours, just added), then we are first!
    if (snap.size === 1) {
        await addXp(userId, 20, "First Score Posted");
    }
};

export const updateMemberRole = async (clubId: string, userId: string, newRole: 'admin' | 'member') => {
    const membershipId = `${userId}_${clubId}`;
    const membershipRef = doc(db, "memberships", membershipId);
    await setDoc(membershipRef, { role: newRole }, { merge: true });
};

export const createManualSession = async (clubId: string, details: { title: string, platform: string, rules: string, endDate: string, challengeType: 'score' | 'speed' | 'custom', customUnit?: string, cover_image_url?: string }) => {
    // 1. Check current sessions count
    const sessionsRef = collection(db, "weekly_sessions");
    // Check for ANY active or upcoming sessions to determine start time
    const q = query(sessionsRef, where("clubId", "==", clubId), where("isActive", "==", true));
    const snap = await getDocs(q);

    let startDate = Timestamp.now();
    let isActive = true;

    // If there is an active session, schedule this one for AFTER it ends
    if (snap.size >= 1) {
        const currentSession = snap.docs[0].data();
        // Parse the end date of the current session
        const currentEndDate = new Date(currentSession.endDate);
        // Set new start date to current end date
        startDate = Timestamp.fromDate(currentEndDate);
        isActive = false; // It's not active yet, it's "upcoming"

        // Check if there is already a "next" session (upcoming)
        // We can check this by looking for sessions with isActive=false and startDate > now? 
        // For simplicity, let's just warn if they try to stack more than 1? 
        // But for now, just let them stack or assume they know what they are doing.
        // Actually, to prevent infinite stacking or confusion, let's allow only ONE upcoming session.
        const qUpcoming = query(sessionsRef, where("clubId", "==", clubId), where("isActive", "==", false), where("isProcessed", "==", false));
        // Wait, "isProcessed" might be undefined. 
        // Let's just rely on the UI to limit them, but here we just proceed.
    }

    const batch = writeBatch(db);

    // 2. Create new session
    const newSessionRef = doc(collection(db, "weekly_sessions"));

    batch.set(newSessionRef, {
        clubId,
        gameTitle: details.title,
        platform: details.platform,
        rules: details.rules,
        isActive: isActive,
        startDate: startDate,
        endDate: details.endDate,
        challengeType: details.challengeType,
        customUnit: details.customUnit || null,
        cover_image_url: details.cover_image_url || null,
        isProcessed: false
    });

    await batch.commit();
    return newSessionRef.id;
};

export const updateSession = async (sessionId: string, details: Partial<WeeklySession>) => {
    const docRef = doc(db, "weekly_sessions", sessionId);
    await updateDoc(docRef, details);
};

export const checkAndActivateUpcomingSession = async (clubId: string) => {
    const sessionsRef = collection(db, "weekly_sessions");
    // Find sessions that are NOT active, NOT processed (i.e. not finished), and have a start date in the past
    const q = query(
        sessionsRef,
        where("clubId", "==", clubId),
        where("isActive", "==", false),
        where("isProcessed", "==", false)
    );

    const snapshot = await getDocs(q);
    const now = new Date();

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        // Check if start date has passed
        // Note: startDate might be a Firestore Timestamp or a string depending on how it was saved.
        let startDate: Date;
        if (data.startDate && data.startDate.toDate) {
            startDate = data.startDate.toDate();
        } else if (data.startDate) {
            startDate = new Date(data.startDate);
        } else {
            // If no start date, maybe it was meant for manual start? or legacy?
            // Skip unless we enforce start dates
            continue;
        }

        if (startDate <= now) {
            console.log(`Activating upcoming session ${docSnap.id}`);
            await updateDoc(docSnap.ref, { isActive: true });
            // Only activate one? Or all eligible? Usually only one should be scheduled overlapping.
            // Let's activate one to be safe, assuming only one game at a time.
            return;
        }
    }
};

export const getAllClubs = async () => {
    const clubsRef = collection(db, "clubs");
    const q = query(clubsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(club => !club.isHidden);
};

export const searchClubs = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const clubsRef = collection(db, "clubs");
    const term = searchTerm.toLowerCase();

    // 1. Search by invite code (exact)
    const qCode = query(clubsRef, where("inviteCode", "==", searchTerm.toUpperCase()), limit(5));
    const snapCode = await getDocs(qCode);

    // 2. Search by name prefix (case-sensitive fallback)
    const capitalizedTerm = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
    const qName = query(
        clubsRef,
        where("name", ">=", capitalizedTerm),
        where("name", "<=", capitalizedTerm + "\uf8ff"),
        limit(20)
    );
    const snapName = await getDocs(qName);

    // Combine and filter
    const results = new Map();
    snapCode.docs.forEach(doc => {
        const data = doc.data();
        if (!data.isHidden) results.set(doc.id, { id: doc.id, ...data });
    });
    snapName.docs.forEach(doc => {
        const data = doc.data();
        if (!data.isHidden) results.set(doc.id, { id: doc.id, ...data });
    });

    return Array.from(results.values());
};

/**
 * Hides a club from public discovery
 * @param identifier Can be Club ID, Name (Exact), or Invite Code
 */
export const hideClub = async (identifier: string) => {
    const clubsRef = collection(db, "clubs");

    // 1. Try by ID
    const docRef = doc(db, "clubs", identifier);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        await updateDoc(docRef, { isHidden: true });
        return { success: true, name: docSnap.data().name };
    }

    // 2. Try by Exact Name
    const qName = query(clubsRef, where("name", "==", identifier), limit(1));
    const snapName = await getDocs(qName);
    if (!snapName.empty) {
        const foundDoc = snapName.docs[0];
        await updateDoc(foundDoc.ref, { isHidden: true });
        return { success: true, name: (foundDoc.data() as any).name };
    }

    // 3. Try by Invite Code
    const qCode = query(clubsRef, where("inviteCode", "==", identifier.toUpperCase()), limit(1));
    const snapCode = await getDocs(qCode);
    if (!snapCode.empty) {
        const foundDoc = snapCode.docs[0];
        await updateDoc(foundDoc.ref, { isHidden: true });
        return { success: true, name: (foundDoc.data() as any).name };
    }

    throw new Error("Club not found by ID, Name, or Invite Code");
};

export const randomizeAllClubBanners = async (banners: { url: string }[]) => {
    const clubsRef = collection(db, "clubs");
    const snapshot = await getDocs(clubsRef);
    const exclusions = ["The Porkchop Xpress", "The Retro Collective"];
    let updatedCount = 0;

    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!exclusions.includes(data.name)) {
            const randomBanner = banners[Math.floor(Math.random() * banners.length)].url;
            batch.update(doc.ref, { bannerUrl: randomBanner });
            updatedCount++;
        }
    });

    await batch.commit();
    return updatedCount;
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

export const joinClub = requestJoin;

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
    xp?: number;
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

export const getClubMessages = subscribeToClubMessages;

export const sendClubMessage = async (clubId: string, userId: string, text: string, userProfile: { displayName: string, photoURL?: string, xp?: number }) => {
    const messagesRef = collection(db, "clubs", clubId, "messages");

    // Fetch latest XP if not provided
    let xp = userProfile.xp;
    if (xp === undefined) {
        const userDoc = await getDoc(doc(db, "users", userId));
        xp = userDoc.exists() ? userDoc.data().xp : 0;
    }

    await addDoc(messagesRef, {
        text,
        userId,
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL || null,
        xp: xp || 0,
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

    // 2. Sort scores with tie-breaker
    const sortedScores = [...scores].sort((a, b) => {
        // Primary Sort: Score Value
        if (sessionData.challengeType === 'speed') {
            if (a.scoreValue !== b.scoreValue) {
                return a.scoreValue - b.scoreValue; // Lower is better
            }
        } else {
            if (a.scoreValue !== b.scoreValue) {
                return b.scoreValue - a.scoreValue; // Higher is better
            }
        }

        // Secondary Sort: Submission Time (Earlier is better)
        // If submittedAt is missing, treat as "infinity" (latest possible) to penalize
        const timeA = a.submittedAt ? (a.submittedAt.seconds || 0) : Number.MAX_SAFE_INTEGER;
        const timeB = b.submittedAt ? (b.submittedAt.seconds || 0) : Number.MAX_SAFE_INTEGER;

        return timeA - timeB;
    });

    // 3. Calculate points
    const updates: { userId: string, pointsToAdd: number, isWinner?: boolean, displayName?: string }[] = [];

    sortedScores.forEach((score, index) => {
        let points = 25;
        if (index === 0) points = 100;
        else if (index === 1) points = 75;
        else if (index === 2) points = 50;

        updates.push({
            userId: score.userId,
            pointsToAdd: points,
            isWinner: index === 0,
            displayName: score.displayName
        });
    });

    // 4. Update Standings
    await updateClubStandings(clubId, updates);

    // 5. Mark Session Processed & Inactive & Store Winner
    const winner = sortedScores.length > 0 ? sortedScores[0] : null;
    const sessionRef = doc(db, "weekly_sessions", sessionId);
    await updateDoc(sessionRef, {
        isProcessed: true,
        isActive: false,
        endDate: new Date().toISOString(),
        winnerId: winner ? winner.userId : null,
        winnerName: winner ? (winner.displayName || "Unknown") : null
    });

    // 6. Update Club with latest winner
    const clubRef = doc(db, "clubs", clubId);
    await updateDoc(clubRef, {
        latestWinnerId: winner ? winner.userId : null,
        latestWinnerName: winner ? (winner.displayName || "Unknown") : null
    });

    // 7. Award XP to Winner (250 XP)
    if (winner && winner.userId) {
        await addXp(winner.userId, 250, "Won Weekly Challenge");
    }

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

export async function deleteUserAccount(userId: string) {
    // 1. Get all memberships for this user
    const membershipsRef = collection(db, "memberships");
    const q = query(membershipsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);

    // 2. Delete memberships
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // 3. Delete user profile
    const userRef = doc(db, "users", userId);
    batch.delete(userRef);

    // 4. Delete user scores (Optional, but good for "Delete All Data")
    const scoresRef = collection(db, "scores");
    const scoresQuery = query(scoresRef, where("userId", "==", userId));
    const scoresSnap = await getDocs(scoresQuery);
    scoresSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();
}

// Social & Search Features
export const getUserByDisplayName = async (displayName: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("displayName", "==", displayName), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
};

export const searchUsers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const usersRef = collection(db, "users");
    const term = searchTerm.toLowerCase();

    // 0. Exact match (case-sensitive) - Best for finding specific users immediately
    const qExact = query(usersRef, where("displayName", "==", searchTerm), limit(1));
    let snapshot = await getDocs(qExact);

    // 1. Case-insensitive prefix search (on normalized field)
    if (snapshot.empty) {
        const qPrefix = query(
            usersRef,
            where("displayNameLowercase", ">=", term),
            where("displayNameLowercase", "<=", term + "\uf8ff"),
            limit(20)
        );
        snapshot = await getDocs(qPrefix);
    }

    // 2. Fallback: try capitalized first letter (common for old records)
    if (snapshot.empty) {
        const capitalizedTerm = term.charAt(0).toUpperCase() + term.slice(1);
        const qCap = query(
            usersRef,
            where("displayName", ">=", capitalizedTerm),
            where("displayName", "<=", capitalizedTerm + "\uf8ff"),
            limit(20)
        );
        snapshot = await getDocs(qCap);
    }

    // 3. Fallback: check searchKeywords for keyword matches
    if (snapshot.empty) {
        const qKeywords = query(
            usersRef,
            where("searchKeywords", "array-contains", term),
            limit(20)
        );
        snapshot = await getDocs(qKeywords);
    }

    // 4. Brute-force exact match on lowercase (Final safety net)
    if (snapshot.empty) {
        console.log(`[searchUsers] Final fallback attempt for: ${term}`);
        const qBrute = query(usersRef, where("displayNameLowercase", "==", term), limit(1));
        snapshot = await getDocs(qBrute);
    }

    const results = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
    })) as { uid: string, displayName: string, photoURL?: string }[];

    // Fetch extra data for search results in parallel
    const enrichedResults = await Promise.all(results.map(async (u) => {
        try {
            // Get friends count
            const friendsSnap = await getDocs(query(collection(db, "users", u.uid, "friends"), limit(100)));

            // Get main club challenge
            const clubs = await getUserClubs(u.uid);
            let currentChallenge = null;
            if (clubs.length > 0) {
                const session = await getActiveSession(clubs[0].id);
                if (session) currentChallenge = session.gameTitle;
            }

            return {
                ...u,
                friendsCount: friendsSnap.size,
                currentChallenge
            };
        } catch (e) {
            return { ...u, friendsCount: 0, currentChallenge: null };
        }
    }));

    return enrichedResults;
};

export const sendFriendRequest = async (senderId: string, receiverId: string) => {
    if (senderId === receiverId) return;

    if (!auth.currentUser) {
        throw new Error("You must be signed in with a real account to send friend requests.");
    }

    try {
        const senderDoc = await getDoc(doc(db, "users", senderId));
        const senderData = senderDoc.data();

        // Unique ID for the request to prevent duplicates
        const requestId = `${senderId}_${receiverId}`;
        const requestRef = doc(db, "friend_requests", requestId);

        // Check if already exist
        const existing = await getDoc(requestRef);
        if (existing.exists()) return;

        await setDoc(requestRef, {
            senderId,
            senderName: senderData?.displayName || auth.currentUser?.displayName || "Player",
            senderPhoto: senderData?.photoURL || auth.currentUser?.photoURL || null,
            senderXp: senderData?.xp || 0,
            receiverId,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        console.log(`Friend request sent from ${senderId} to ${receiverId}`);
    } catch (e) {
        console.error("sendFriendRequest error:", e);
        throw e;
    }
};

export const getSentFriendRequests = async (userId: string) => {
    try {
        const q = query(
            collection(db, "friend_requests"),
            where("senderId", "==", userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data().receiverId) as string[];
    } catch (e) {
        console.error("getSentFriendRequests error:", e);
        return [];
    }
};

export const getFriendRequests = async (userId: string) => {
    const q = query(
        collection(db, "friend_requests"),
        where("receiverId", "==", userId),
        where("status", "==", "pending")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FriendRequest[];
};

export const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    const requestRef = doc(db, "friend_requests", requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) return;
    const data = requestDoc.data();

    if (status === 'rejected') {
        await deleteDoc(requestRef);
    } else {
        await runTransaction(db, async (transaction) => {
            transaction.update(requestRef, { status: 'accepted' });

            // Add to both users' friendship lists
            const senderFriendRef = doc(db, "users", data.senderId, "friends", data.receiverId);
            const receiverFriendRef = doc(db, "users", data.receiverId, "friends", data.senderId);

            transaction.set(senderFriendRef, {
                friendId: data.receiverId,
                addedAt: serverTimestamp()
            });
            transaction.set(receiverFriendRef, {
                friendId: data.senderId,
                addedAt: serverTimestamp()
            });

            // XP Rewards: 25 XP for both
            const sRef = doc(db, "users", data.senderId);
            const rRef = doc(db, "users", data.receiverId);
            transaction.update(sRef, { xp: increment(25) });
            transaction.update(rRef, { xp: increment(25) });
        });
    }
};

export const getFriends = async (userId: string) => {
    if (!userId) return [];

    const friendsRef = collection(db, "users", userId, "friends");
    const snapshot = await getDocs(friendsRef);

    // Fetch user details for each friend in parallel
    const friends = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const friendId = docSnap.id;
        const profile = await getUserPublicProfile(friendId);
        return profile;
    }));

    return friends.filter(f => f !== null);
};

export const checkFriendshipStatus = async (userId: string, friendId: string) => {
    const friendRef = doc(db, "users", userId, "friends", friendId);
    const snap = await getDoc(friendRef);
    return snap.exists();
};

export const getUserPublicProfile = async (userId: string) => {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();

    // 1. Get clubs joined count
    const clubs = await getUserClubs(userId);

    // 2. Get total challenges count (via standing records or scores)
    const standingsRef = collection(db, "season_standings");
    const qStandings = query(standingsRef, where("userId", "==", userId));
    const standingsSnap = await getDocs(qStandings);

    let totalWins = 0;
    let totalPoints = 0;
    standingsSnap.forEach(d => {
        totalWins += d.data().wins || 0;
        totalPoints += d.data().points || 0;
    });

    // 3. Find "Main" Club (the one they have most points in or just the first)
    let mainClub = null;
    if (clubs.length > 0) {
        // Try to find status in the first club
        const club = clubs[0];
        const allStandings = await getSeasonStandings(club.id) as any[];
        const userStandingIndex = allStandings.findIndex(s => s.userId === userId);

        mainClub = {
            id: club.id,
            name: club.name,
            rank: userStandingIndex !== -1 ? userStandingIndex + 1 : allStandings.length + 1,
            totalMembers: allStandings.length
        };
    }

    // 4. Get Friends Count
    const friendsSnap = await getDocs(query(collection(db, "users", userId, "friends"), limit(500)));
    const friendsCount = friendsSnap.size;

    // 5. Get Current Challenge (from main club)
    let currentChallenge = null;
    if (mainClub) {
        const activeSession = await getActiveSession(mainClub.id);
        if (activeSession) currentChallenge = activeSession.gameTitle;
    }

    return {
        uid: userId,
        displayName: userData.displayName || "Unknown User",
        photoURL: userData.photoURL || null,
        clubsJoined: clubs.length,
        challengesCount: standingsSnap.size, // Number of clubs they've participated in
        wins: totalWins,
        friendsCount,
        currentChallenge,
        mainClub,
        xp: userData.xp || 0,
        clubs
    } as UserPublicProfile;
};

// GOTM Management
export const createGOTM = async (clubId: string, details: Omit<GOTM, "id">) => {
    // Basic overlap check
    const gotmRef = collection(db, "gotm");
    const q = query(
        gotmRef,
        where("clubId", "==", clubId)
    );
    const snap = await getDocs(q);

    // Client-side overlap check
    const hasOverlap = snap.docs.some(doc => {
        const existing = doc.data() as GOTM;
        // Check if existing range overlaps with new range
        // Overlap if (StartA <= EndB) and (EndA >= StartB)
        return existing.startDate <= details.endDate && existing.endDate >= details.startDate;
    });

    if (hasOverlap) {
        // Just log warning, allow proceed as admin might want to overwrite or fix
        console.warn("Detected overlapping GOTM schedule");
    }

    const docRef = doc(collection(db, "gotm"));
    await setDoc(docRef, {
        ...details,
        id: docRef.id
    });
    return docRef.id;
};

export const getCurrentGOTM = async (clubId: string) => {
    const gotmRef = collection(db, "gotm");
    const now = new Date().toISOString().split('T')[0];
    const q = query(
        gotmRef,
        where("clubId", "==", clubId)
    );

    const snap = await getDocs(q);

    // Sort descending by startDate (latest first)
    const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as GOTM))
        .sort((a, b) => b.startDate.localeCompare(a.startDate));

    // Find the first one that started on or before today, and hasn't ended yet
    const active = sorted.find(g => g.startDate <= now && g.endDate >= now);

    return active || null;
};

export const getGameOfTheMonth = getCurrentGOTM;

export const getUpcomingGOTM = async (clubId: string) => {
    const gotmRef = collection(db, "gotm");
    const now = new Date().toISOString().split('T')[0];
    const q = query(
        gotmRef,
        where("clubId", "==", clubId)
    );

    const snap = await getDocs(q);

    // Sort ascending by startDate (earliest first)
    const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as GOTM))
        .sort((a, b) => a.startDate.localeCompare(b.startDate));

    // Find the first one that starts in the future
    const upcoming = sorted.find(g => g.startDate > now);

    return upcoming || null;
};

export const getPastGOTMs = async (clubId: string) => {
    const gotmRef = collection(db, "gotm");
    const now = new Date().toISOString().split('T')[0];
    const q = query(
        gotmRef,
        where("clubId", "==", clubId)
    );

    const snap = await getDocs(q);

    // Sort descending by endDate (most recent past game first)
    const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as GOTM))
        .filter(g => g.endDate < now)
        .sort((a, b) => b.endDate.localeCompare(a.endDate));

    return sorted;
};

export const submitGOTMReview = async (clubId: string, gotmId: string, userId: string, review: Omit<GOTMReview, "id" | "gotmId" | "userId" | "createdAt">) => {
    const reviewId = `${userId}_${gotmId}`;
    const reviewRef = doc(db, "gotm_reviews", reviewId);

    await setDoc(reviewRef, {
        ...review,
        id: reviewId,
        gotmId,
        userId,
        clubId, // Denormalize for easier querying if needed
        createdAt: new Date().toISOString()
    }, { merge: true });

    // Award XP
    await addXp(userId, 50, "Reviewed GOTM");
};

export const getGOTMReviews = async (gotmId: string) => {
    const reviewsRef = collection(db, "gotm_reviews");
    const q = query(reviewsRef, where("gotmId", "==", gotmId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as GOTMReview);
};

export const getUserGOTMReview = async (gotmId: string, userId: string) => {
    const reviewId = `${userId}_${gotmId}`;
    const reviewRef = doc(db, "gotm_reviews", reviewId);
    const snap = await getDoc(reviewRef);
    if (snap.exists()) {
        return snap.data() as GOTMReview;
    }
    return null;
};
