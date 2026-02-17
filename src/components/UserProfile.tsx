
"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";
import Link from "next/link";
import { User, LogOut, Settings, Trophy } from "lucide-react";
import { getUserClubs, getXpLevel } from "@/lib/firestore-service";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { UserAvatar } from "./UserAvatar";

export function UserProfile() {
    const { user, logout } = useAuth();
    const [isWinner, setIsWinner] = useState(false);
    const [xp, setXp] = useState(0);

    useEffect(() => {
        if (!user) return;

        // 1. Check if winner
        const checkWinner = async () => {
            try {
                const clubs = await getUserClubs(user.uid);
                setIsWinner(clubs.some(c => c.latestWinnerId === user.uid));
            } catch (e) {
                console.error("Error checking winner status:", e);
            }
        };
        checkWinner();

        // 2. Listen for XP
        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                setXp(doc.data().xp || 0);
            }
        });

        return () => unsub();
    }, [user]);

    if (!user) {
        // ... (Guest state remains same)
        return (
            <div className="flex gap-2">
                <Link href="/login">
                    <Button size="sm" variant="ghost" className="text-primary hover:text-primary-dim">
                        Login
                    </Button>
                </Link>
                <Link href="/register">
                    <Button size="sm" className="font-bold">
                        Register
                    </Button>
                </Link>
            </div>
        );
    }

    const level = getXpLevel(xp);

    return (
        <div className="flex items-center gap-2 md:gap-4">
            <Link href={`/user?id=${user.uid}`} className="flex items-center gap-3 group">
                <div className="text-right hidden md:block group-hover:opacity-80 transition-opacity">
                    <p className="text-sm font-bold text-white flex items-center justify-end gap-1">
                        {user.displayName || user.email}
                        {isWinner && <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                    </p>
                    <p className="text-xs text-primary font-mono font-black tracking-widest leading-none">
                        LVL {level}
                        {isWinner && <span className="text-yellow-500 ml-1">• CHAMPION</span>}
                    </p>
                </div>
                <UserAvatar
                    photoURL={user.photoURL}
                    displayName={user.displayName || ""}
                    xp={xp}
                    isWinner={isWinner}
                    size="md"
                />
            </Link>

            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                <Link href="/profile">
                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary">
                        <Settings className="w-4 h-4" />
                    </Button>
                </Link>
                <Button onClick={() => logout()} size="icon" variant="ghost" className="w-8 h-8 rounded-full text-muted-foreground hover:text-red-400">
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
