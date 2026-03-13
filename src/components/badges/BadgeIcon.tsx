'use client';

import React from 'react';
import { BADGE_REGISTRY } from '@/lib/badges/config';
import { formatDistanceToNow } from 'date-fns';

interface BadgeIconProps {
    badgeId: string;
    count?: number;
    unlockedAt?: any; // Firestore Timestamp
    size?: 'sm' | 'md' | 'lg';
}

export default function BadgeIcon({ badgeId, count = 1, unlockedAt, size = 'md' }: BadgeIconProps) {
    const badge = BADGE_REGISTRY[badgeId];

    if (!badge) return null;

    const Icon = badge.icon;

    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-24 h-24'
    };

    const iconSizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    const unlockedDate = unlockedAt?.toDate ? unlockedAt.toDate() : new Date(unlockedAt);
    const timeAgo = unlockedAt ? formatDistanceToNow(unlockedDate, { addSuffix: true }) : 'Recently';

    return (
        <div
            className="group relative flex flex-col items-center justify-center outline-none hover:z-30 focus-within:z-30 transition-all"
            tabIndex={0} // Allows focusing on tap/click for mobile tooltip
        >
            {/* Badge Container */}
            <div className={`
                ${sizeClasses[size]}
                rounded-full 
                flex items-center justify-center
                relative
                transition-all duration-300
                hover:scale-110 hover:-translate-y-1
                group-focus:scale-110 group-focus:-translate-y-1
                bg-slate-800/50 backdrop-blur-md border border-slate-700/50
                cursor-help
                shadow-[0_4px_12px_rgba(0,0,0,0.5)]
                mb-2
            `}>
                <Icon className={`${iconSizeClasses[size]} ${badge.color}`} />

                {/* Stackable Count Badge */}
                {badge.type === 'stackable' && count > 1 && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-lg z-10">
                        x{count}
                    </div>
                )}
            </div>

            {/* Badge Name Underneath */}
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center max-w-[80px] leading-tight ${badge.color}`}>
                {badge.name}
            </span>

            {/* Tooltip */}
            <div className="absolute top-full mt-2 w-48 p-3 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all duration-200 z-50 pointer-events-none transform origin-top scale-95 group-hover:scale-100 group-focus:scale-100">
                <div className="text-center">
                    <h4 className={`font-bold text-sm mb-1 ${badge.color}`}>{badge.name}</h4>
                    <p className="text-xs text-slate-300 mb-2 leading-tight">{badge.description}</p>
                    {unlockedAt && (
                        <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                            Unlocked {timeAgo}
                        </p>
                    )}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900/95 border-l border-t border-slate-700 transform rotate-45"></div>
            </div>
        </div>
    );
}
