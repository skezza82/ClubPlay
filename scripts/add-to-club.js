const admin = require('firebase-admin');

// Initialize with project ID
admin.initializeApp({ projectId: 'club-play-app' });
const db = admin.firestore();

const userId = 'X9RgGptWKmZNHa4gKLt3b5e1rTF2';
const clubId = 'retro-gaming-club';

async function addToClub() {
    console.log(`Adding user ${userId} to club ${clubId}...`);

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        console.error('User not found');
        return;
    }
    const userData = userDoc.data();

    const membershipId = `${userId}_${clubId}`;
    const membershipRef = db.collection('memberships').doc(membershipId);

    const membershipData = {
        clubId,
        userId,
        displayName: userData.displayName || 'IamVengeance',
        photoURL: userData.photoURL || null,
        role: 'member',
        joinedAt: new Date().toISOString()
    };

    await membershipRef.set(membershipData);
    console.log('Membership created');

    // Update club member count
    await db.collection('clubs').doc(clubId).update({
        memberCount: admin.firestore.FieldValue.increment(1)
    });
    console.log('Club member count updated');

    // Also check if there's an active session
    const sessions = await db.collection('weekly_sessions')
        .where('clubId', '==', clubId)
        .where('isActive', '==', true)
        .get();

    if (sessions.empty) {
        console.log('No active session found. Creating one for screenshots...');
        const sessionRef = db.collection('weekly_sessions').doc();
        await sessionRef.set({
            clubId,
            isActive: true,
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            gameTitle: 'Super Mario Bros',
            platform: 'NES',
            challengeType: 'score',
            startDate: admin.firestore.Timestamp.now()
        });
        console.log('Active session created');
    } else {
        console.log('Active session already exists');
    }
}

addToClub().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
