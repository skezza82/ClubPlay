
"use client";

import { User, Trophy } from "lucide-react";
import { getXpLevel } from "@/lib/firestore-service";

interface UserAvatarProps {
    uid?: string;
    photoURL?: string | null;
    displayName?: string;
    xp?: number;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
    showLevel?: boolean;
    isWinner?: boolean;
    className?: string;
    onClick?: () => void;
}

export function UserAvatar({
    photoURL,
    displayName,
    xp = 0,
    size = "md",
    showLevel = true,
    isWinner = false,
    className = "",
    onClick
}: UserAvatarProps) {
    const level = getXpLevel(xp);

    const sizeClasses = {
        xs: "w-6 h-6",
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-14 h-14",
        xl: "w-16 h-16",
        "2xl": "w-24 h-24",
        full: "w-full h-full"
    };

    const bubbleSizeClasses = {
        xs: "w-3 h-3 text-[6px] -bottom-0.5 -right-0.5 border",
        sm: "w-3.5 h-3.5 text-[7px] -bottom-0.5 -right-0.5 border",
        md: "w-4.5 h-4.5 text-[8px] -bottom-0.5 -right-0.5 border",
        lg: "w-6 h-6 text-[10px] -bottom-0.5 -right-0.5 border-2",
        xl: "w-7 h-7 text-[11px] -bottom-1 -right-1 border-2",
        "2xl": "w-9 h-9 text-[14px] -bottom-1 -right-1 border-2"
    };

    const trophySizeClasses = {
        xs: "w-3 h-3 p-0.5 -top-0.5 -right-0.5",
        sm: "w-4.5 h-4.5 p-0.5 -top-1 -right-1",
        md: "w-6 h-6 p-1 -top-1 -right-1",
        lg: "w-7 h-7 p-1 -top-1 -right-1",
        xl: "w-9 h-9 p-1.5 -top-1.5 -right-1.5",
        "2xl": "w-14 h-14 p-2 -top-3 -right-3"
    };

    return (
        <div
            className={`relative shrink-0 ${className} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {/* Avatar Circle */}
            <div className={`${sizeClasses[size]} rounded-xl bg-surface border border-white/10 flex items-center justify-center overflow-hidden transition-colors`}>
                {photoURL ? (
                    <img src={photoURL} alt={displayName || "User"} className="w-full h-full object-cover" />
                ) : (
                    <User className={`${size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} text-primary/40`} />
                )}
            </div>

            {/* Level Badge Bubble */}
            {showLevel && size !== "full" && (
                <div className={`absolute ${bubbleSizeClasses[size as keyof typeof bubbleSizeClasses] || bubbleSizeClasses.md} bg-primary text-black font-black rounded-full flex items-center justify-center border-surface z-20 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]`}>
                    {level}
                </div>
            )}

            {/* Winner Trophy */}
            {isWinner && size !== "full" && (
                <div className={`absolute ${trophySizeClasses[size as keyof typeof trophySizeClasses] || trophySizeClasses.md} bg-yellow-500 rounded-full border border-surface shadow-lg z-10 flex items-center justify-center`}>
                    <Trophy className="w-full h-full text-black" />
                </div>
            )}
        </div>
    );
}
