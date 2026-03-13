const admin = require('firebase-admin');
const path = require('path');

// =========================================================================
// SETUP INSTRUCTIONS:
// 1. You need a Firebase Admin SDK private key (serviceAccountKey.json) 
//    saved in this directory (scripts/serviceAccountKey.json).
// 2. You can generate one from Firebase Console -> Project Settings -> Service Accounts
// 3. Run this script via: node scripts/retroactive-badges.js
// =========================================================================

// Initialize Firebase Admin (assuming serviceAccountKey.json exists)
let db;
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
} catch (e) {
    console.error("❌ ERROR: Could not load serviceAccountKey.json.");
    console.error("Please download it from Firebase Console -> Project Settings -> Service Accounts, and place it in the scripts/ folder.");
    process.exit(1);
}

// Internal replica of the XP helper
const calculateLevel = (xp) => {
    let level = 1;
    let xpRequired = 100;

    let remainingXp = xp;
    while (remainingXp >= xpRequired) {
        remainingXp -= xpRequired;
        level++;
        xpRequired = Math.floor(xpRequired * 1.5);
    }
    return level;
};

async function runRetroactiveBadges() {
    console.log("🚀 Starting Retroactive Badge Migration...");

    try {
        const usersSnapshot = await db.collection('users').get();
        console.log(`Found ${usersSnapshot.size} total users.`);

        let processed = 0;
        let awardedBadgesTotal = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const updates = {};
            let badgesAdded = 0;
            const currentBadges = userData.badges || {};

            const awardBadge = (badgeId) => {
                if (!currentBadges[badgeId]) {
                    updates[`badges.${badgeId}`] = {
                        count: 1,
                        unlockedAt: admin.firestore.FieldValue.serverTimestamp()
                    };
                    badgesAdded++;
                }
            };

            // 1. Level Badges
            const xp = userData.xp || 0;
            const level = calculateLevel(xp);

            if (level >= 2) awardBadge('level2');
            if (level >= 5) awardBadge('level5');
            if (level >= 10) awardBadge('level10');
            if (level >= 25) awardBadge('level25');

            // 2. Friends Badges
            try {
                const friendsSnap = await db.collection('users').doc(userId).collection('friends').get();
                const friendsCount = friendsSnap.size;
                if (friendsCount >= 10) awardBadge('friends10');
                if (friendsCount >= 50) awardBadge('friends50');
            } catch (err) {
                console.warn(`Could not fetch friends for ${userId}`, err);
            }

            // 3. Club Leader Badge
            // We search clubs where this user is owner
            try {
                const clubsSnap = await db.collection('clubs').where('ownerId', '==', userId).get();
                if (!clubsSnap.empty) {
                    awardBadge('club_leader');
                }
            } catch (err) { }

            // 4. GotM Reviews
            // Searching the GOTM collection to see if they wrote a review
            try {
                const gotmSnap = await db.collection('gotm_reviews').where('userId', '==', userId).get();
                if (!gotmSnap.empty) {
                    awardBadge('gotm_review');
                }
            } catch (err) { }

            // 5. Challenge Wins
            try {
                const standingsSnap = await db.collection('season_standings').where('userId', '==', userId).get();
                let hasWins = false;
                standingsSnap.forEach(d => {
                    if (d.data().wins && d.data().wins > 0) hasWins = true;
                });
                if (hasWins) awardBadge('challenge_win');
            } catch (err) { }

            // 6. Club Hopper
            try {
                const membershipsSnap = await db.collection('memberships').where('userId', '==', userId).get();
                if (membershipsSnap.size >= 5) awardBadge('club_hopper_5');
            } catch (err) { }

            // Apply updates if any badges were earned
            if (Object.keys(updates).length > 0) {
                await userDoc.ref.update(updates);
                console.log(`✅ Awarded ${badgesAdded} badges to ${userData.displayName || userId}`);
                awardedBadgesTotal += badgesAdded;
            }

            processed++;
            if (processed % 50 === 0) {
                console.log(`...Processed ${processed}/${usersSnapshot.size} users`);
            }
        }

        console.log(`\n🎉 Migration Complete!`);
        console.log(`Total users checked: ${processed}`);
        console.log(`Total new badges awarded natively: ${awardedBadgesTotal}`);

    } catch (error) {
        console.error("Migration Error:", error);
    }
}

runRetroactiveBadges();
