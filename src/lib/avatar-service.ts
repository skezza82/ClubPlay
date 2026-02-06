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

export const uploadSessionBoxart = async (clubId: string, file: File) => {
    console.log("Starting session boxart upload for club:", clubId, "file:", file.name);
    try {
        const storageRef = ref(storage, `session_boxarts/${clubId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        console.log("Session boxart upload successful, URL:", url);
        return url;
    } catch (error) {
        console.error("Firebase Storage Error (Session Boxart):", error);
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
    { id: "pirate", url: "/avatars/avatar_pirate.png", name: "Pirate" },
    { id: "fairy", url: "/avatars/avatar_fairy.png", name: "Fairy" },
    { id: "robot", url: "/avatars/avatar_robot.png", name: "Robot" },
    { id: "adventurer", url: "/avatars/avatar_adventurer.png", name: "Adventurer" },
    { id: "ninja", url: "/avatars/avatar_ninja.png", name: "Ninja" },
    { id: "wizard", url: "/avatars/avatar_wizard.png", name: "Wizard" },
    { id: "knight", url: "/avatars/avatar_knight.png", name: "Knight" },
    { id: "alien", url: "/avatars/avatar_alien.png", name: "Alien" },
    { id: "zombie", url: "/avatars/avatar_zombie.png", name: "Zombie" },
    { id: "cyberpunk", url: "/avatars/avatar_cyberpunk.png", name: "Cyberpunk" },
    { id: "female_adventurer", url: "/avatars/avatar_female_adventurer.png", name: "Adventurer (F)" },
];
