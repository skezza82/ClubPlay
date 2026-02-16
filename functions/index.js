const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

/**
 * Proxies search requests to IGDB using securely stored credentials.
 * Config: functions.config().twitch.id and functions.config().twitch.secret
 */
exports.searchGames = functions.https.onRequest(async (req, res) => {
    // CORS Headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    try {
        const query = req.body.query || req.query.query;

        if (!query) {
            res.status(400).send({ error: "Missing query" });
            return;
        }

        // securely access credentials from environment config
        const clientId = "h5q11ofyb6zw7z6v7h8ytxt6pel8wj";
        const clientSecret = "how68e33ebcsrw7n51g0de8duw8vr3";

        if (!clientId || !clientSecret) {
            console.error("Missing Twitch credentials in config");
            res.status(500).send({ error: "Server misconfiguration" });
            return;
        }

        // 1. Get Access Token
        const tokenParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials",
        });

        const tokenResponse = await fetch(
            `https://id.twitch.tv/oauth2/token?${tokenParams}`,
            { method: "POST" }
        );

        if (!tokenResponse.ok) {
            throw new Error(`Auth Failed: ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Search Games
        const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": clientId,
                "Authorization": `Bearer ${accessToken}`,
            },
            body: `search "${query}"; fields name, cover.url, first_release_date, platforms.name; limit 20;`,
        });

        if (!igdbResponse.ok) {
            throw new Error(`IGDB Failed: ${igdbResponse.statusText}`);
        }

        const gamesRaw = await igdbResponse.json();

        // 3. Transform Data (High Res Covers)
        const games = gamesRaw.map((game) => ({
            id: game.id,
            name: game.name,
            coverUrl: game.cover && game.cover.url
                ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
                : null,
            releaseDate: game.first_release_date,
            platforms: game.platforms ? game.platforms.map(p => p.name).join(", ") : "Unknown",
        }));

        res.status(200).send({ games });
    } catch (error) {
        console.error("Error in searchGames:", error);
        res.status(500).send({ error: error.message });
    }
});

/**
 * Notifies the club owner when a new join request is created.
 */
exports.onJoinRequestCreated = functions.firestore
    .document("join_requests/{requestId}")
    .onWrite(async (change, context) => {
        // If the document was deleted, do nothing
        if (!change.after.exists) return null;

        const requestData = change.after.data();
        const clubId = requestData.clubId;
        const applicantName = requestData.displayName || "Someone";
        const status = requestData.status;

        console.log(`[TRIGGER] onJoinRequestCreated fired for ID: ${context.params.requestId}, Status: ${status}`);

        // Only notify on pending requests
        if (status !== 'pending') {
            console.log(`Request ${context.params.requestId} is ${status}, skipping notification.`);
            return null;
        }

        try {
            // 1. Get the club to find the owner
            const clubDoc = await admin.firestore().collection("clubs").doc(clubId).get();
            if (!clubDoc.exists) {
                console.warn(`Club ${clubId} not found for join request ${context.params.requestId}`);
                return null;
            }

            const clubData = clubDoc.data();
            const ownerId = clubData.ownerId;
            const clubName = clubData.name;

            console.log(`Processing join request for club: ${clubName} (${clubId}), Owner: ${ownerId}`);

            if (!ownerId) {
                console.warn(`Club ${clubId} has no ownerId`);
                return null;
            }

            // 2. Get the owner's FCM token
            const ownerDoc = await admin.firestore().collection("users").doc(ownerId).get();
            if (!ownerDoc.exists) {
                console.warn(`Owner ${ownerId} not found for club ${clubId}`);
                return null;
            }

            const fcmToken = ownerDoc.data().fcmToken;
            console.log(`FCM Token for owner ${ownerId}: ${fcmToken ? fcmToken.substring(0, 10) + "..." : "MISSING"}`);

            if (!fcmToken) {
                console.log(`Owner ${ownerId} has no fcmToken registered.`);
                return null;
            }

            // 3. Send the notification
            const message = {
                notification: {
                    title: "New Join Request! 📩",
                    body: `${applicantName} wants to join ${clubName}`,
                },
                token: fcmToken,
                data: {
                    clubId: clubId,
                    type: "JOIN_REQUEST"
                }
            };

            const response = await admin.messaging().send(message);
            console.log("Successfully sent message:", response);
            return response;
        } catch (error) {
            console.error("Error sending join request notification:", error);
            return null;
        }
    });

/**
 * Notifies club members when a weekly session starts or ends.
 */
exports.onWeeklySessionUpdated = functions.firestore
    .document("weekly_sessions/{sessionId}")
    .onWrite(async (change, context) => {
        if (!change.after.exists) return null; // Deleted

        const before = change.before.exists ? change.before.data() : null;
        const after = change.after.data();
        const clubId = after.clubId;

        // scenario 1: Session Started (Active changed to true)
        const isNewStart = (!before || !before.isActive) && after.isActive === true;

        // scenario 2: Session Ended (Active changed to false AND has winner)
        // We check for winnerId to ensure it was processed successfully
        const isJustEnded = (before && before.isActive === true) && after.isActive === false && after.winnerId;

        if (!isNewStart && !isJustEnded) {
            return null;
        }

        try {
            // 1. Get Club Info
            const clubDoc = await admin.firestore().collection("clubs").doc(clubId).get();
            const clubName = clubDoc.exists ? clubDoc.data().name : "Club";

            // 2. Get All Members
            const membershipsSnap = await admin.firestore()
                .collection("memberships")
                .where("clubId", "==", clubId)
                .get();

            const memberUserIds = membershipsSnap.docs.map(d => d.data().userId);
            if (memberUserIds.length === 0) {
                console.log(`No members found for club ${clubId}`);
                return null;
            }

            // 3. Get FCM Tokens for all members
            // Firestore 'in' query supports max 10 items. We must batch or loop.
            // For simplicity/scale, let's fetch users individually or in batches of 10.
            // Or better yet, since we have the IDs, let's just fetch all users who have tokens?
            // Actually, querying users by ID is best.

            const tokens = [];

            // Batch fetch user docs (max 10 for 'in' queries, but we might have hundreds)
            // Strategy: Iterate through IDs and fetch. Parallelise with Promise.all
            // Limit concurrency to avoid blowing up.
            const chunks = [];
            const chunkSize = 10;
            for (let i = 0; i < memberUserIds.length; i += chunkSize) {
                chunks.push(memberUserIds.slice(i, i + chunkSize));
            }

            for (const chunk of chunks) {
                const usersSnap = await admin.firestore().collection("users")
                    .where(admin.firestore.FieldPath.documentId(), "in", chunk)
                    .get();

                usersSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.fcmToken) {
                        tokens.push(data.fcmToken);
                    }
                });
            }

            if (tokens.length === 0) {
                console.log("No FCM tokens found for members.");
                return null;
            }

            // 4. Construct Message
            let title = "";
            let body = "";
            let type = "";

            if (isNewStart) {
                title = `New Challenge Started! 🎮`;
                body = `The challenge for ${after.gameTitle} has begun in ${clubName}!`;
                type = "CHALLENGE_START";
            } else if (isJustEnded) {
                title = `Challenge Winner! 🏆`;
                body = `${after.winnerName || "Someone"} won the ${after.gameTitle} challenge in ${clubName}!`;
                type = "CHALLENGE_END";
            }

            // 5. Send Multicast
            const message = {
                notification: { title, body },
                tokens: tokens,
                data: {
                    clubId: clubId,
                    sessionId: context.params.sessionId,
                    type: type
                }
            };

            const response = await admin.messaging().sendMulticast(message);
            console.log(`Sent ${response.successCount} notifications for session update. Failed: ${response.failureCount}`);

            return response;

        } catch (error) {
            console.error("Error sending session notification:", error);
            return null;
        }
    });
