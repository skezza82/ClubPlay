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
    const [topPadding, setTopPadding] = useState("env(safe-area-inset-top)");

    useEffect(() => {
        if (!user) return;

        // Android WebViews and standalone PWAs sometimes fail to report safe-area-inset-top correctly.
        // Fallback to 35px (Standard Android Status Bar height) just for them.
        const isCapacitor = (window as any).Capacitor !== undefined;
        const isAndroidWebView = /wv/.test(navigator.userAgent) && /Android/.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches && /Android/.test(navigator.userAgent);

        if (isCapacitor || isAndroidWebView || isStandalone) {
            setTopPadding("max(env(safe-area-inset-top), 48px)");
        }

        const unsubscribe = listenToFriendRequests(user.uid, (requests) => {
            setPendingCount(requests.length);
        });

        return () => unsubscribe();
    }, [user]);

    if (!user) return null;

    return (
        <div className="relative z-[100] w-full">
            {/* fixed Header Row: Anchored to the very top of the viewport */}
            <div
                className="fixed top-0 left-0 right-0 z-[120] bg-background/90 backdrop-blur-xl border-b border-white/5 shadow-xl"
                style={{ paddingTop: topPadding }}
            >
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <PremiumLogo />
                    <UserProfile />
                </div>
            </div>

            {/* Spacer for the fixed header */}
            <div className="h-16" style={{ paddingTop: topPadding }} />

            {/* Scrolling Navigation Row: Moves with the page */}
            <nav className="bg-background/20 border-b border-white/5 overflow-x-auto scrollbar-hide">
                <div className="container mx-auto px-4 flex items-center justify-center lg:justify-start gap-8 py-3 md:py-4">
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
