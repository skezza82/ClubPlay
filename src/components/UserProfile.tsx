
"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";
import Link from "next/link";
import { User, LogOut, Settings } from "lucide-react";

export function UserProfile() {
    const { user, signOut } = useAuth();

    if (!user) {
        return (
            <Link href="/register">
                <Button size="sm" variant="ghost" className="text-primary hover:text-primary-dim">
                    Login / Register
                </Button>
            </Link>
        );
    }

    return (
        <div className="flex items-center gap-2 md:gap-4">
            <Link href="/profile" className="flex items-center gap-3 group">
                <div className="text-right hidden md:block group-hover:opacity-80 transition-opacity">
                    <p className="text-sm font-bold text-white">{user.user_metadata?.username || user.email}</p>
                    <p className="text-xs text-primary">Member</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface border border-primary/30 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                    {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-5 h-5 text-primary" />
                    )}
                </div>
            </Link>

            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                <Link href="/profile">
                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary">
                        <Settings className="w-4 h-4" />
                    </Button>
                </Link>
                <Button onClick={() => signOut()} size="icon" variant="ghost" className="w-8 h-8 rounded-full text-muted-foreground hover:text-red-400">
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
