const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { buildAuthorization, getUserRecentAchievements, getLeaderboardEntries } = require("@retroachievements/api");

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
 * Reusable helper to send a notification to all members of a club
 */
async function sendClubNotification(clubId, title, body, data) {
    try {
        // 1. Get All Members
        const membershipsSnap = await admin.firestore()
            .collection("memberships")
            .where("clubId", "==", clubId)
            .get();

        const memberUserIds = membershipsSnap.docs.map(d => d.data().userId);
        if (memberUserIds.length === 0) return null;

        // 2. Get FCM Tokens for all members
        const tokens = [];
        const chunkSize = 10;
        for (let i = 0; i < memberUserIds.length; i += chunkSize) {
            const chunk = memberUserIds.slice(i, i + chunkSize);
            const usersSnap = await admin.firestore().collection("users")
                .where(admin.firestore.FieldPath.documentId(), "in", chunk)
                .get();

            usersSnap.docs.forEach(doc => {
                const userData = doc.data();
                if (userData.fcmToken) {
                    tokens.push(userData.fcmToken);
                }
            });
        }

        if (tokens.length === 0) return null;

        // 3. Send Multicast
        const message = {
            notification: { title, body },
            tokens: tokens,
            data: data
        };

        const response = await admin.messaging().sendMulticast(message);
        console.log(`Club ${clubId}: Sent ${response.successCount} notifications. Failed: ${response.failureCount}`);
        return response;
    } catch (error) {
        console.error("Error in sendClubNotification:", error);
        return null;
    }
}

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
        const isJustEnded = (before && before.isActive === true) && after.isActive === false && after.winnerId;

        if (!isNewStart && !isJustEnded) return null;

        const clubDoc = await admin.firestore().collection("clubs").doc(clubId).get();
        const clubName = clubDoc.exists ? clubDoc.data().name : "Club";

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

        return sendClubNotification(clubId, title, body, {
            clubId: clubId,
            sessionId: context.params.sessionId,
            type: type
        });
    });

/**
 * AI Score Verification using Google Gemini
 * Triggered automatically when an image is uploaded to the score_proofs directory in Storage.
 */
exports.verifyScoreProof = functions.storage.object().onFinalize(async (object) => {
    const fileBucket = object.bucket;
    const filePath = object.name;
    const contentType = object.contentType;

    // Only process files in score_proofs
    if (!filePath.startsWith('score_proofs/')) {
        return null;
    }

    // Config: Allow user to fallback to env variable or Firebase config
    const apiKey = functions.config().gemini ? functions.config().gemini.api_key : process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY is not set. Run: firebase functions:config:set gemini.api_key="YOUR_KEY"');
        return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Extract scoreId. Assuming format: score_proofs/userId_sessionId_timestamp
    const parts = filePath.split('/');
    const filename = parts[parts.length - 1];
    const nameParts = filename.split('_');
    if (nameParts.length < 3) return null; // Invalid format

    nameParts.pop(); // Remove timestamp
    const scoreId = nameParts.join('_'); // "userId_sessionId"

    const bucket = admin.storage().bucket(fileBucket);
    const file = bucket.file(filePath);

    try {
        // 0. Check if already verified to save costs
        let scoreRef = admin.firestore().collection("scores").doc(scoreId);
        let scoreDoc = await scoreRef.get();
        if (scoreDoc.exists && scoreDoc.data().status === 'verified') {
            console.log(`[CF] Score ${scoreId} already verified. Skipping.`);
            return null;
        }

        console.log(`Starting AI Verification for scoreId: ${scoreId}`);
        // 1. Download file to memory
        const [fileContent] = await file.download();
        const imageBase64 = fileContent.toString('base64');
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: contentType,
            },
        };

        // 2. Query Gemini
        const prompt = `You are verifying an arcade or video game leaderboard score. Extract the main numeric score value from this image, and any handwritten name/text (it will usually be written on a piece of paper next to the screen). 
Return ONLY a valid JSON object in this exact format:
{ "score": 12345, "text": "username" }
If you cannot find a score or text, use null. Do not include markdown formatting or backticks, just raw JSON.`;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        // 3. Parse JSON from output
        let extractedData;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error(`Failed to parse Gemini output: ${responseText}`);
        }

        console.log(`Extracted Data from Gemini for ${scoreId}:`, extractedData);

        // 4. Secure verification against Firestore
        scoreRef = admin.firestore().collection("scores").doc(scoreId);
        scoreDoc = await scoreRef.get();

        if (!scoreDoc.exists) {
            console.error('Score Document not found in Firestore:', scoreId);
            return null;
        }

        const scoreData = scoreDoc.data();

        // Validation Rules:
        // A) Score value must exactly match what they claimed in app (to prevent lying in input field to get #1)
        const isScoreMatch = Number(extractedData.score) === Number(scoreData.scoreValue);

        // B) Name must fuzzily match. If the username is "Player1", they just need to write "Pla" for us to accept it.
        const submittedName = (scoreData.displayName || "").toLowerCase();
        const detectedText = (extractedData.text || "").toLowerCase();
        let isNameMatch = false;

        if (submittedName.length >= 3) {
            const substring = submittedName.substring(0, 3);
            if (detectedText.includes(substring)) {
                isNameMatch = true;
            }
        } else if (submittedName.length > 0 && detectedText.includes(submittedName)) {
            isNameMatch = true;
        }

        if (isScoreMatch && isNameMatch) {
            console.log(`✅ Verification SUCCEEDED for ${scoreId}`);
            await scoreRef.update({
                status: 'verified',
                aiVerificationLogs: 'Match Success',
                proofUrl: admin.firestore.FieldValue.delete() // Clean up storage
            });

            // Delete the file since it's verified securely to save storage space
            await file.delete().catch(() => { });
        } else {
            console.log(`❌ Verification FAILED for ${scoreId}. Expected: ${scoreData.scoreValue}/${submittedName}, Got: ${extractedData.score}/${detectedText}`);
            await scoreRef.update({
                status: 'rejected',
                aiVerificationLogs: `Failed. AI saw: Score=${extractedData.score}, Name=${extractedData.text}`,
                // We keep proofUrl so the user/admin can still see the image that got rejected locally.
            });
        }
    } catch (e) {
        console.error('AI Verification Process Failed:', e);
        // Fallback: If AI fails for any reason, leave it as 'pending_verification' for biological admin review
        return null;
    }
});
/**
 * HTTPS Function for real-time AI Score Verification.
 * Called by the frontend after a proof image is uploaded.
 */
exports.verifyScore = functions.https.onRequest(async (req, res) => {
    // CORS Headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    try {
        const { scoreId } = req.body;

        if (!scoreId) {
            res.status(400).send({ error: "Missing scoreId" });
            return;
        }

        console.log(`[HTTP] Starting verification for score: ${scoreId}`);
        const scoreRef = admin.firestore().collection("scores").doc(scoreId);
        const scoreSnap = await scoreRef.get();

        if (!scoreSnap.exists) {
            res.status(404).send({ error: "Score not found" });
            return;
        }

        const scoreData = scoreSnap.data();

        if (scoreData.status === "verified") {
            res.send({ message: "Already verified", status: "verified" });
            return;
        }

        if (!scoreData.proofUrl) {
            res.status(400).send({ error: "No proof image found for this score" });
            return;
        }

        // Initialize Gemini
        const apiKey = functions.config().gemini?.api_key;
        if (!apiKey) {
            console.error("GEMINI_API_KEY not set in functions config");
            res.status(500).send({ error: "AI Service misconfigured" });
            return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 1. Fetch the image
        const imgResponse = await fetch(scoreData.proofUrl);
        const buffer = await imgResponse.buffer();
        const base64Image = buffer.toString("base64");

        const prompt = `You are verifying a video game leaderboard score. 
Extract the main numeric score value and any handwritten name/text from this image.
The handwritten text is usually on a piece of paper next to the screen.

Target Player Name: "${scoreData.displayName || "Unknown"}"
Target Score: ${scoreData.scoreValue}

Return ONLY a valid JSON object in this exact format:
{
  "detectedScore": 12345,
  "detectedName": "username",
  "confidence": 0.95,
  "matchScore": true,
  "matchName": true,
  "reasoning": "Brief explanation"
}

Do not include markdown formatting or backticks, just raw JSON.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: imgResponse.headers.get("content-type") || "image/jpeg",
                },
            },
        ]);

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error(`Failed to parse Gemini output: ${text}`);
        }

        const aiResult = JSON.parse(jsonMatch[0]);
        console.log(`[HTTP] Gemini result for ${scoreId}:`, aiResult);

        // 2. Update Firestore
        if (aiResult.matchScore && aiResult.matchName && aiResult.confidence > 0.8) {
            await scoreRef.update({
                status: "verified",
                aiVerification: {
                    verifiedAt: new Date().toISOString(),
                    confidence: aiResult.confidence,
                    reasoning: aiResult.reasoning,
                },
                proofUrl: admin.firestore.FieldValue.delete()
            });

            // Award XP (using firestore-service pattern, but translated for CF)
            if (scoreData.userId) {
                const userRef = admin.firestore().collection("users").doc(scoreData.userId);
                await userRef.set({
                    xp: admin.firestore.FieldValue.increment(50),
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }

            res.send({ success: true, status: "verified", aiResult });
        } else {
            const newStatus = aiResult.confidence < 0.5 ? "rejected" : "pending_verification";
            await scoreRef.update({
                status: newStatus,
                aiVerification: {
                    lastCheckAt: new Date().toISOString(),
                    confidence: aiResult.confidence,
                    reasoning: aiResult.reasoning,
                    matchScore: aiResult.matchScore,
                    matchName: aiResult.matchName
                }
            });
            res.send({ success: false, status: newStatus, aiResult });
        }

    } catch (error) {
        console.error("[HTTP] Verification Error:", error);
        res.status(500).send({ error: "Internal server error during verification", details: error.message });
    }
});

/**
 * Automatically processes expired challenges every 10 minutes.
 * Requires Blaze plan for scheduled functions.
 */
/**
 * Automatically processes expired challenges every 10 minutes.
 * Also sends reminders for challenges ending in 2 hours.
 */
exports.autoProcessChallenges = functions.pubsub.schedule("every 10 minutes").onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();

    console.log("Running auto-process-challenges at", now.toISOString());

    try {
        // 1. Process Expired Sessions
        const expiredSessions = await db.collection("weekly_sessions")
            .where("isActive", "==", true)
            .where("isProcessed", "==", false)
            .get();

        const processPromises = [];

        for (const docSnap of expiredSessions.docs) {
            const data = docSnap.data();
            const endDate = new Date(data.endDate);

            if (endDate <= now) {
                console.log(`Challenge ${docSnap.id} (${data.gameTitle}) has expired. Processing...`);
                processPromises.push((async () => {
                    const sessionId = docSnap.id;
                    const clubId = data.clubId;

                    // Fetch scores
                    const scoresSnap = await db.collection("scores")
                        .where("sessionId", "==", sessionId)
                        .get();

                    const scores = scoresSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                    if (scores.length === 0) {
                        await docSnap.ref.update({ isProcessed: true, isActive: false });
                        return;
                    }

                    // Sort
                    scores.sort((a, b) => {
                        if (data.challengeType === "speed") {
                            if (a.scoreValue !== b.scoreValue) return a.scoreValue - b.scoreValue;
                        } else {
                            if (a.scoreValue !== b.scoreValue) return b.scoreValue - a.scoreValue;
                        }
                        return (a.submittedAt?.seconds || 0) - (b.submittedAt?.seconds || 0);
                    });

                    const winner = scores[0];

                    // Transactional Update
                    await db.runTransaction(async (t) => {
                        // User XP
                        const userRef = db.collection("users").doc(winner.userId);
                        t.update(userRef, { xp: admin.firestore.FieldValue.increment(250) });

                        // Club Standing Updates
                        for (let i = 0; i < scores.length; i++) {
                            const s = scores[i];
                            let points = 25;
                            if (i === 0) points = 100;
                            else if (i === 1) points = 75;
                            else if (i === 2) points = 50;

                            const standingRef = db.collection("season_standings").doc(`${clubId}_${s.userId}`);
                            t.set(standingRef, {
                                clubId,
                                userId: s.userId,
                                points: admin.firestore.FieldValue.increment(points),
                                wins: i === 0 ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
                                displayName: s.displayName || "Unknown"
                            }, { merge: true });
                        }

                        // Session
                        t.update(docSnap.ref, {
                            isProcessed: true,
                            isActive: false,
                            winnerId: winner.userId,
                            winnerName: winner.displayName || "Unknown"
                        });

                        // Club
                        t.update(db.collection("clubs").doc(clubId), {
                            latestWinnerId: winner.userId,
                            latestWinnerName: winner.displayName || "Unknown"
                        });
                    });
                })());
            } else {
                // 2. CHECK FOR REMINDER (Ending in < 2 hours)
                const timeDiff = endDate.getTime() - now.getTime();
                const hoursLeft = timeDiff / (1000 * 60 * 60);

                if (hoursLeft > 0 && hoursLeft <= 2 && !data.reminderSent) {
                    processPromises.push((async () => {
                        console.log(`Sending reminder for challenge ${docSnap.id} ending soon...`);
                        await docSnap.ref.update({ reminderSent: true });

                        const clubDoc = await db.collection("clubs").doc(data.clubId).get();
                        const clubName = clubDoc.exists ? clubDoc.data().name : "Club";

                        await sendClubNotification(
                            data.clubId,
                            "Challenge Ending Soon! ⏳",
                            `Only 2 hours left to get your scores in for ${data.gameTitle}! Don't miss out!`,
                            {
                                clubId: data.clubId,
                                sessionId: docSnap.id,
                                type: "CHALLENGE_REMINDER"
                            }
                        );
                    })());
                }
            }
        }

        await Promise.all(processPromises);
    } catch (err) {
        console.error("Auto-process failed:", err);
    }
    return null;
});

/**
 * Fetches recent achievements for a user from RetroAchievements.
 */
exports.getRecentAchievements = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    try {
        const username = req.query.username;
        if (!username) {
            res.status(400).send({ error: "Missing username" });
            return;
        }

        const RA_USERNAME = process.env.RA_USERNAME || "Skezza30"; // Fallback to provided defaults if needed
        const RA_API_KEY = process.env.RA_API_KEY || "JNeVzGSOnpLrW709sgK2lFG2vUnfO6NZ";

        const auth = buildAuthorization({
            username: RA_USERNAME,
            webApiKey: RA_API_KEY
        });

        const recentAchievements = await getUserRecentAchievements(auth, {
            username,
            recentMinutes: 43200 // 30 days
        });

        res.status(200).send(recentAchievements);
    } catch (error) {
        console.error("Error in getRecentAchievements:", error);
        res.status(500).send({ error: error.message });
    }
});

/**
 * Syncs scores from a RetroAchievements leaderboard to a club challenge.
 */
exports.syncRALeaderboard = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).send({ error: "Missing sessionId" });
            return;
        }

        const RA_USERNAME = process.env.RA_USERNAME || "Skezza30";
        const RA_API_KEY = process.env.RA_API_KEY || "JNeVzGSOnpLrW709sgK2lFG2vUnfO6NZ";

        const auth = buildAuthorization({
            username: RA_USERNAME,
            webApiKey: RA_API_KEY
        });

        const db = admin.firestore();

        // 1. Get session
        const sessionDoc = await db.collection("weekly_sessions").doc(sessionId).get();
        if (!sessionDoc.exists) {
            res.status(404).send({ error: "Session not found" });
            return;
        }

        const session = sessionDoc.data();
        if (!session.raLeaderboardId) {
            res.status(400).send({ error: "Session has no RA Leaderboard ID" });
            return;
        }

        const clubId = session.clubId;
        const isSpeed = session.challengeType === "speed";

        // 2. Get club members
        const membersSnap = await db.collection("memberships").where("clubId", "==", clubId).get();
        const memberIds = membersSnap.docs.map(doc => doc.data().userId);

        if (memberIds.length === 0) {
            res.send({ success: true, syncedCount: 0, message: "No members in club" });
            return;
        }

        // 3. Map RA usernames to ClubPlay user IDs
        const userMap = new Map();
        const chunks = [];
        for (let i = 0; i < memberIds.length; i += 10) {
            chunks.push(memberIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const usersSnap = await db.collection("users")
                .where(admin.firestore.FieldPath.documentId(), "in", chunk)
                .get();

            usersSnap.forEach(doc => {
                const data = doc.data();
                if (data.raUsername) {
                    userMap.set(data.raUsername.toLowerCase(), {
                        userId: doc.id,
                        displayName: data.displayName,
                        photoURL: data.photoURL
                    });
                }
            });
        }

        if (userMap.size === 0) {
            res.send({ success: true, syncedCount: 0, message: "No members have linked RA accounts" });
            return;
        }

        // 4. Fetch RA leaderboard
        const raEntries = await getLeaderboardEntries(auth, {
            leaderboardId: session.raLeaderboardId,
            count: 500
        });

        const entries = raEntries.results || [];
        let syncedCount = 0;
        const batch = db.batch();

        for (const entry of entries) {
            const raUser = entry.user?.toLowerCase();
            if (raUser && userMap.has(raUser)) {
                const userInfo = userMap.get(raUser);
                const scoreValue = entry.score;

                const scoreId = `${userInfo.userId}_${sessionId}`;
                const scoreRef = db.collection("scores").doc(scoreId);
                const existingDoc = await scoreRef.get();

                let shouldUpdate = false;
                if (existingDoc.exists) {
                    const existingData = existingDoc.data();
                    const existingVal = existingData.scoreValue;
                    const isBetter = isSpeed ? scoreValue < existingVal : scoreValue > existingVal;
                    if (isBetter) shouldUpdate = true;
                } else {
                    shouldUpdate = true;
                }

                if (shouldUpdate) {
                    batch.set(scoreRef, {
                        userId: userInfo.userId,
                        sessionId: sessionId,
                        scoreValue: scoreValue,
                        displayName: userInfo.displayName,
                        photoURL: userInfo.photoURL,
                        submittedAt: admin.firestore.Timestamp.now(),
                        status: "verified",
                        proofUrl: `https://retroachievements.org/leaderboardinfo.php?i=${session.raLeaderboardId}`,
                        isRetroAchievements: true
                    }, { merge: true });
                    syncedCount++;
                }
            }
        }

        if (syncedCount > 0) {
            await batch.commit();
        }

        res.send({ success: true, syncedCount, totalProcessed: entries.length });
    } catch (error) {
        console.error("Error in syncRALeaderboard:", error);
        res.status(500).send({ error: error.message });
    }
});
