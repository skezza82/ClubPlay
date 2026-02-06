"use client";

import Link from "next/link";
import { PremiumLogo } from "./PremiumLogo";
import { UserProfile } from "./UserProfile";
import { useAuth } from "@/context/AuthContext";
import { Compass, PlusSquare } from "lucide-react";

export function Navbar() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <nav className="sticky top-0 z-[100] w-full border-b border-white/5 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <PremiumLogo />

                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/clubs" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                            <Compass className="w-4 h-4" />
                            Find Clubs
                        </Link>
                        <Link href="/clubs/create" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                            <PlusSquare className="w-4 h-4" />
                            Create
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <UserProfile />
                </div>
            </div>
        </nav>
    );
}
