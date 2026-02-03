import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { storage, auth, db } from "./firebase";

export const uploadAvatar = async (userId: string, file: File) => {
    const storageRef = ref(storage, `avatars/${userId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
};

export const updateUserAvatar = async (userId: string, photoURL: string) => {
    // 1. Update Firebase Auth Profile
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
    }

    // 2. Update Firestore User Document
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { photoURL });
};

export const PRESET_AVATARS = [
    { id: "viking", url: "/avatars/viking.png", name: "Viking" },
    { id: "adventurer", url: "/avatars/adventurer.png", name: "Adventurer" },
    { id: "spaceman", url: "/avatars/spaceman.png", name: "Spaceman" },
];
