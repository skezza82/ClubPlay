
"use client";

import { Gamepad2 } from "lucide-react";
import Link from "next/link";
import { useGamepad } from "@/hooks/useGamepad";

export function PremiumLogo() {
    const { hasGamepadAccess } = useGamepad();

    return (
        <div className="relative inline-flex items-center gap-3">
            {/* Gamepad Icon - Only pulses and links to Console Corner when detected */}
            {hasGamepadAccess ? (
                <Link
                    href="/console-corner"
                    className="relative group cursor-pointer"
                    title="Enter Console Corner"
                >
                    <div className="absolute inset-0 bg-primary blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                    <Gamepad2 className="w-12 h-12 relative z-10 transition-all duration-500 animate-pulsing-rgb scale-110 group-hover:scale-125" />
                </Link>
            ) : (
                <div className="relative opacity-20 transition-all duration-500">
                    <Gamepad2 className="w-12 h-12 text-white relative z-10" />
                </div>
            )}

            {/* Logo Text - Always links to Home */}
            <Link href="/" className="flex flex-col items-start group cursor-pointer">
                <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    CLUB<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 group-hover:to-primary transition-all duration-300">PLAY</span>
                </h1>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-primary-dim/80 group-hover:text-primary transition-colors">
                    {hasGamepadAccess ? "Hardware Connected" : "Competitive Leagues"}
                </span>
            </Link>
        </div>
    );
}
