"use client";

import Link from "next/link";
import { PremiumLogo } from "./PremiumLogo";
import { UserProfile } from "./UserProfile";
import { useAuth } from "@/context/AuthContext";
import { Compass, Gamepad2, PlusSquare, Search, Users } from "lucide-react";
import { useGamepad } from "@/hooks/useGamepad";
import { useEffect, useState } from "react";
import { listenToFriendRequests } from "@/lib/firestore-service";

export function Navbar() {
    const { user } = useAuth();
    const { hasGamepadAccess } = useGamepad();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = listenToFriendRequests(user.uid, (requests) => {
            setPendingCount(requests.length);
        });

        return () => unsubscribe();
    }, [user]);

    if (!user) return null;

    return (
        <div className="relative z-[150] w-full pt-[env(safe-area-inset-top,0px)]">
            {/* fixed Header Row: Anchored to the very top, using safe area for padding */}
            <header
                className="fixed top-0 left-0 right-0 z-[120] premium-glass border-b-0 m-2 md:m-4 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden mt-[env(safe-area-inset-top,8px)]"
            >
                <div className="container mx-auto px-6 h-14 md:h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-8">
                        <PremiumLogo />

                        {/* Desktop Navigation Links - Integrated like mockup */}
                        <div className="hidden lg:flex items-center gap-6">
                            <Link href="/clubs" className="flex items-center gap-2 group">
                                <Search className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">Find Clubs</span>
                            </Link>
                            <Link href="/arcade" className="flex items-center gap-2 group">
                                <Gamepad2 className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">Arcade</span>
                            </Link>
                            <Link href="/friends" className="flex items-center gap-2 group relative">
                                <Users className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                {pendingCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">Friends</span>
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <UserProfile />
                    </div>
                </div>
            </header>

            {/* Spacer for the fixed header */}
            <div className="h-16 md:h-20" />

            {/* Mobile Navigation Row: Only visible on smaller screens */}
            <nav className="lg:hidden m-2 md:m-4 mt-0 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] overflow-x-auto scrollbar-hide py-3">
                <div className="flex items-center justify-center gap-8 px-4">
                    <Link href="/clubs" className="flex items-center gap-2 group whitespace-nowrap">
                        <div className="bg-white/5 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                            <Compass className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-white transition-colors">Clubs</span>
                    </Link>

                    <Link href="/arcade" className="flex items-center gap-2 group whitespace-nowrap">
                        <div className="bg-white/5 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                            <Gamepad2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-white transition-colors">Arcade</span>
                    </Link>

                    <Link href="/friends" className="flex items-center gap-2 group whitespace-nowrap relative">
                        <div className="relative">
                            <div className="bg-white/5 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                                <Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-black ring-2 ring-background">
                                    {pendingCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-white transition-colors">Friends</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
