
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type User = {
    id: string;
    email?: string;
    user_metadata?: {
        username?: string;
        avatar_url?: string;
    };
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signUp: (email: string, password: string, username: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check active session
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user as User);
            setLoading(false);
        };
        checkUser();
    }, []);

    const signIn = async () => {
        // Simulating sign in
        const { data } = await supabase.auth.signInWithPassword();
        if (data.user) {
            setUser(data.user as User);
            router.push("/");
        }
    };

    const signUp = async (email: string, password: string, username: string) => {
        // Simulating sign up
        const { data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });

        if (data.user) {
            setUser(data.user as User);
            router.push("/");
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
