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
    .onCreate(async (snapshot, context) => {
        const requestData = snapshot.data();
        const clubId = requestData.clubId;
        const applicantName = requestData.displayName || "Someone";

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
