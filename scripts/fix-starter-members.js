const admin = require('firebase-admin');

// Ensure you have an environment variable GOOGLE_APPLICATION_CREDENTIALS pointing to a service account key JSON file
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function addAllUsersToStarterSquad() {
    try {
        const FEEDER_CLUB_ID = "feeder-club-global-v1";

        // 1. Fetch all users
        const usersSnapshot = await db.collection('users').get();
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Fetch all existing memberships for the club
        const membershipsSnapshot = await db.collection('memberships').where('clubId', '==', FEEDER_CLUB_ID).get();
        const existingMemberIds = new Set(membershipsSnapshot.docs.map(doc => doc.data().userId));

        let addedCount = 0;
        const batch = db.batch();

        // 3. For each user not in the club, add them
        for (const user of allUsers) {
            if (!existingMemberIds.has(user.id)) {
                const membershipRef = db.collection('memberships').doc(`${FEEDER_CLUB_ID}_${user.id}`);
                batch.set(membershipRef, {
                    clubId: FEEDER_CLUB_ID,
                    userId: user.id,
                    role: "member",
                    joinedAt: new Date().toISOString()
                });
                addedCount++;

                // Add to season standings as well if missing to avoid blank states
                const standingRef = db.collection('season_standings').doc(`${FEEDER_CLUB_ID}_${user.id}`);
                batch.set(standingRef, {
                    clubId: FEEDER_CLUB_ID,
                    userId: user.id,
                    points: 0,
                    wins: 0
                }, { merge: true });
            }
        }

        // 4. Update the club's memberCount
        if (addedCount > 0) {
            await batch.commit();

            const newTotal = existingMemberIds.size + addedCount;
            await db.collection('clubs').doc(FEEDER_CLUB_ID).update({
                memberCount: newTotal
            });

            console.log(`Successfully added ${addedCount} new members. Total members: ${newTotal}`);
        } else {
            console.log(`No new members to add. Total members: ${existingMemberIds.size}`);
        }
    } catch (error) {
        console.error('Error adding users to Starter Squad:', error);
    } finally {
        process.exit();
    }
}

addAllUsersToStarterSquad();
