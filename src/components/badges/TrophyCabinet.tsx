'use client';

import React from 'react';
import BadgeIcon from './BadgeIcon';
import { BADGE_REGISTRY } from '@/lib/badges/config';
import { Trophy } from 'lucide-react';

interface TrophyCabinetProps {
    badges?: Record<string, any>;
    title?: string;
    emptyText?: string;
}

export default function TrophyCabinet({
    badges,
    title = "Trophy Cabinet",
    emptyText = "No badges earned yet."
}: TrophyCabinetProps) {

    // Filter out badges that aren't in the registry (just in case)
    const validBadges = Object.entries(badges || {}).filter(([id]) => BADGE_REGISTRY[id]);

    if (validBadges.length === 0) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-bold text-white tracking-wide">{title}</h3>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                    <Trophy className="w-12 h-12 text-slate-600 mb-3 opacity-50" />
                    <p className="text-sm font-medium text-slate-400">{emptyText}</p>
                </div>
            </div>
        );
    }

    // Sort badges by unlockedAt date (newest first)
    const sortedBadges = validBadges.sort((a, b) => {
        const timeA = a[1].unlockedAt?.seconds || 0;
        const timeB = b[1].unlockedAt?.seconds || 0;
        return timeB - timeA;
    });

    return (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                    <h3 className="font-bold text-white tracking-wide">{title}</h3>
                </div>
                <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-slate-700">
                    {sortedBadges.length} Unlocked
                </div>
            </div>

            <div className="flex flex-wrap gap-4 items-start">
                {sortedBadges.map(([badgeId, data]) => (
                    <BadgeIcon
                        key={badgeId}
                        badgeId={badgeId}
                        count={data.count}
                        unlockedAt={data.unlockedAt}
                    />
                ))}
            </div>
        </div>
    );
}
