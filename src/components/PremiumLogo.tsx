
"use client";

import { Gamepad2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGamepad } from "@/hooks/useGamepad";

export function PremiumLogo() {
    const { hasGamepadAccess } = useGamepad();
    const router = useRouter();
    const [pressCount, setPressCount] = useState(0);
    const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handlePress = (e?: React.MouseEvent) => {
        const next = pressCount + 1;
        setPressCount(next);

        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => setPressCount(0), 4000);

        if (next >= 20) {
            if (e) e.preventDefault();
            setPressCount(0);
            router.push("/memorial");
        }
    };

    useEffect(() => {
        return () => {
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        };
    }, []);

    return (
        <div className="relative inline-flex items-center gap-3">
            {/* Gamepad Icon - Only pulses and links to Console Corner when detected */}
            {hasGamepadAccess ? (
                <Link
                    href="/console-corner"
                    className="relative group cursor-pointer"
                    title="Enter Console Corner"
                    onClick={handlePress}
                >
                    <div className="absolute inset-0 bg-primary blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                    <Gamepad2 className="w-12 h-12 relative z-10 text-primary transition-all duration-500 animate-pulse-primary scale-110 group-hover:scale-125" />
                </Link>
            ) : (
                <button
                    type="button"
                    onClick={handlePress}
                    className="relative opacity-40 transition-all duration-500 cursor-pointer"
                    title="Controller"
                >
                    <Gamepad2 className="w-12 h-12 text-primary relative z-10" />
                </button>
            )}

            {/* Logo Text - Always links to Home */}
            <Link href="/" className="flex flex-col items-start group cursor-pointer">
                <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    CLUB<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 group-hover:to-primary transition-all duration-300">PLAY</span>
                </h1>
            </Link>
        </div>
    );
}
