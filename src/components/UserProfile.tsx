
"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";
import Link from "next/link";
import { User, LogOut, Settings, Trophy } from "lucide-react";
import { getUserClubs } from "@/lib/firestore-service";
import { useEffect, useState } from "react";

export function UserProfile() {
    const { user, logout } = useAuth();
    const [isWinner, setIsWinner] = useState(false);

    useEffect(() => {
        if (!user) return;
        const checkWinner = async () => {
            try {
                const clubs = await getUserClubs(user.uid);
                setIsWinner(clubs.some(c => c.latestWinnerId === user.uid));
            } catch (e) {
                console.error("Error checking winner status:", e);
            }
        };
        checkWinner();
    }, [user]);

    if (!user) {
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

    return (
        <div className="flex items-center gap-2 md:gap-4">
            <Link href="/profile" className="flex items-center gap-3 group">
                <div className="text-right hidden md:block group-hover:opacity-80 transition-opacity">
                    <p className="text-sm font-bold text-white flex items-center justify-end gap-1">
                        {user.displayName || user.email}
                        {isWinner && <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                    </p>
                    <p className="text-xs text-primary">{isWinner ? "Latest Champion" : "Member"}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface border border-primary/30 flex items-center justify-center overflow-hidden hover:border-primary transition-colors relative">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-5 h-5 text-primary" />
                    )}
                    {isWinner && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border border-black shadow-lg z-10">
                            <Trophy className="w-2 h-2 text-black" />
                        </div>
                    )}
                </div>
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
