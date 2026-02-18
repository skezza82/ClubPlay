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

export const uploadClubBanner = async (clubId: string, file: File) => {
    console.log("Starting club banner upload for club:", clubId, "file:", file.name);
    try {
        const storageRef = ref(storage, `club_banners/${clubId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        console.log("Club banner upload successful, URL:", url);
        return url;
    } catch (error) {
        console.error("Firebase Storage Error (Club Banner):", error);
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

export const DEFAULT_BANNERS = [
    { id: "neon_arcade", url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=1200&h=400", name: "Neon Arcade" },
    { id: "cyberpunk", url: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1200&h=400", name: "High Tech" },
    { id: "fantasy", url: "https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&q=80&w=1200&h=400", name: "Etheral Realms" },
    { id: "retro_setup", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200&h=400", name: "Retro Vibe" },
    { id: "controller", url: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=1200&h=400", name: "Minimal" },
    { id: "synth_grid", url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200&h=400", name: "Synthwave Grid" },
    { id: "molten", url: "https://images.unsplash.com/photo-1463171359079-3d19a365b98a?auto=format&fit=crop&q=80&w=1200&h=400", name: "Molten Core" },
    { id: "ice", url: "https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?auto=format&fit=crop&q=80&w=1200&h=400", name: "Ice Fractal" },
    { id: "forest", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200&h=400", name: "Midnight Forest" },
    { id: "gold", url: "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?auto=format&fit=crop&q=80&w=1200&h=400", name: "Golden Particles" },
];
