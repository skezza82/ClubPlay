"use client";

import Link from "next/link";
import { PremiumLogo } from "./PremiumLogo";
import { UserProfile } from "./UserProfile";
import { useAuth } from "@/context/AuthContext";
import { Compass, Gamepad2, PlusSquare, Search, Users } from "lucide-react";
import { useGamepad } from "@/hooks/useGamepad";

export function Navbar() {
    const { user } = useAuth();
    const { hasGamepadAccess } = useGamepad();

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
                        <Link href="/friends" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                            <Users className="w-4 h-4" />
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
                    <Link href="/friends" className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground hover:text-primary transition-all flex flex-col items-center gap-1 group">
                        <Users className="w-5 h-5 group-active:scale-90 transition-transform" />
                        <span>Friends</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
