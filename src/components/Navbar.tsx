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
        <nav className="sticky top-0 z-[100] w-full border-b border-white/5 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <PremiumLogo />

                    <div className="hidden lg:flex items-center gap-6">
                        <Link href="/clubs" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                            <Compass className="w-4 h-4" />
                            Clubs
                        </Link>
                        <Link href="/arcade" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4" />
                            Arcade
                        </Link>
                        <Link href="/friends" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 relative">
                            <div className="relative">
                                <Users className="w-4 h-4" />
                                {pendingCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-black text-black">
                                        {pendingCount}
                                    </span>
                                )}
                            </div>
                            Friends
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <UserProfile />
                </div>
            </div>

            {/* Mobile Navigation Row - Visible only on small screens */}
            <div className="lg:hidden border-t border-white/5 overflow-x-auto scrollbar-hide">
                <div className="flex items-center justify-around min-w-full px-4 py-3 gap-6">
                    <Link href="/clubs" className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground hover:text-primary transition-all flex flex-col items-center gap-1 group">
                        <Compass className="w-5 h-5 group-active:scale-90 transition-transform" />
                        <span>Clubs</span>
                    </Link>
                    <Link href="/arcade" className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground hover:text-primary transition-all flex flex-col items-center gap-1 group">
                        <Gamepad2 className="w-5 h-5 group-active:scale-90 transition-transform" />
                        <span>Arcade</span>
                    </Link>
                    <Link href="/friends" className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground hover:text-primary transition-all flex flex-col items-center gap-1 group relative">
                        <div className="relative">
                            <Users className="w-5 h-5 group-active:scale-90 transition-transform" />
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-black shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]">
                                    {pendingCount}
                                </span>
                            )}
                        </div>
                        <span>Friends</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
