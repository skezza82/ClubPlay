"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    User,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { initializePushNotifications, addPushListeners, saveFcmToken } from "@/lib/notifications";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    bypassAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    loginWithGoogle: async () => { },
    signUp: async () => { },
    signIn: async () => { },
    logout: async () => { },
    bypassAuth: async () => { },
});

import { useRouter } from "next/navigation";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Handle redirect result
        const handleRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    await createUserDocument(result.user);
                }
            } catch (error) {
                console.error("Error handling redirect result", error);
            }
        };
        handleRedirect();

        const initNotifications = async (userId: string) => {
            addPushListeners();
            const token = await initializePushNotifications();
            if (token) {
                await saveFcmToken(userId, token);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
            if (user) {
                createUserDocument(user);
                initNotifications(user.uid);
            }
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();

        // Detect mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );

        try {
            if (isMobile) {
                await signInWithRedirect(auth, provider);
            } else {
                const result = await signInWithPopup(auth, provider);
                await createUserDocument(result.user);
            }
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const signUp = async (email: string, password: string, displayName: string) => {
        const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });
        await createUserDocument(result.user);
    };

    const signIn = async (email: string, password: string) => {
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        await signInWithEmailAndPassword(auth, email, password);
    };

    const createUserDocument = async (user: User) => {
        const { doc, setDoc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: new Date().toISOString(),
                role: "user"
            });
        }
    };

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null); // Clear manual state if any
            router.push('/');
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const bypassAuth = async () => {
        const mockUser: any = {
            uid: "test-user-id",
            email: "test@example.com",
            displayName: "Test User",
            photoURL: null,
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: "",
            tenantId: null,
            delete: async () => { },
            getIdToken: async () => "",
            getIdTokenResult: async () => ({} as any),
            reload: async () => { },
            toJSON: () => ({}),
            phoneNumber: null,
            providerId: "firebase",
        };
        setUser(mockUser);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, signUp, signIn, logout, bypassAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
