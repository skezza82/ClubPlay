const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
