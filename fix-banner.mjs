import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Add process.env to silence "FIREBASE_API_KEY NOT SET" error, though technically these are NEXT_PUBLIC_ values
// This is a quick script to fix a missing banner.

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixETBanner() {
    try {
        console.log("Starting banner fix script...");
        const clubsRef = collection(db, "clubs");
        const snapshot = await getDocs(clubsRef);
        let updatedCount = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            if ((data.bannerUrl && data.bannerUrl.includes("photo-1463171359079")) || (data.name && data.name.includes("ET"))) {
                console.log(`Found broken club: ${data.name}`);
                const clubRef = doc(db, "clubs", docSnap.id);
                // A new space/retro themed banner that works for "ET" or the broken one
                await updateDoc(clubRef, {
                    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200&h=400"
                });
                updatedCount++;
                console.log(`Updated banner for ${data.name}`);
            }
        }
        console.log(`Finished. Updated ${updatedCount} clubs.`);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

fixETBanner();
