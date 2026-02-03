import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { storage, auth, db } from "./firebase";

export const uploadAvatar = async (userId: string, file: File) => {
    console.log("Starting upload for user:", userId, "file:", file.name);
    try {
        const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        console.log("Upload successful, URL:", url);
        return url;
    } catch (error) {
        console.error("Firebase Storage Error:", error);
        throw error;
    }
};

export const uploadClubLogo = async (clubId: string, file: File) => {
    console.log("Starting club logo upload for club:", clubId, "file:", file.name);
    try {
        const storageRef = ref(storage, `club_logos/${clubId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        console.log("Club logo upload successful, URL:", url);
        return url;
    } catch (error) {
        console.error("Firebase Storage Error (Club Logo):", error);
        throw error;
    }
};

export const updateUserAvatar = async (userId: string, photoURL: string) => {
    console.log("Updating user avatar in Auth and Firestore...");
    // 1. Update Firebase Auth Profile
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
    }

    // 2. Update Firestore User Document (using setDoc to ensure it exists)
    const { setDoc } = await import("firebase/firestore");
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { photoURL }, { merge: true });
    console.log("User document updated successfully.");
};

export const PRESET_AVATARS = [
    { id: "viking", url: "/avatars/viking.png", name: "Viking" },
    { id: "adventurer", url: "/avatars/adventurer.png", name: "Adventurer" },
    { id: "spaceman", url: "/avatars/spaceman.png", name: "Spaceman" },
];
