'use client';

import React, { useEffect, useState } from 'react';
import { BADGE_REGISTRY } from '@/lib/badges/config';
import BadgeIcon from './BadgeIcon';
import { PartyPopper } from 'lucide-react';

interface UnlockEventDetail {
    badgeId: string;
    count: number;
}

export default function BadgeUnlockNotification() {
    const [unlocks, setUnlocks] = useState<UnlockEventDetail[]>([]);

    useEffect(() => {
        const handleBadgeUnlock = (e: Event) => {
            const customEvent = e as CustomEvent<UnlockEventDetail>;
            const { badgeId, count } = customEvent.detail;

            // Add to the queue
            setUnlocks(prev => [...prev, { badgeId, count }]);

            // Auto remove after 5 seconds
            setTimeout(() => {
                setUnlocks(prev => prev.filter(u => u.badgeId !== badgeId || u.count !== count));
            }, 5000);
        };

        window.addEventListener('badge-unlocked', handleBadgeUnlock);
        return () => window.removeEventListener('badge-unlocked', handleBadgeUnlock);
    }, []);

    if (unlocks.length === 0) return null;

    return (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-4 items-end pointer-events-none">
            {unlocks.map((unlock, i) => {
                const badge = BADGE_REGISTRY[unlock.badgeId];
                if (!badge) return null;

                return (
                    <div
                        key={`${unlock.badgeId}-${unlock.count}-${i}`}
                        className="animate-slide-up-fade flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl border-l-[6px] border border-slate-700/50 p-4 rounded-2xl shadow-2xl pointer-events-auto"
                        style={{ borderColor: 'var(--primary)', borderLeftColor: 'var(--primary)' }}
                    >
                        <BadgeIcon badgeId={unlock.badgeId} count={unlock.count} size="md" />
                        <div className="flex flex-col pr-4">
                            <span className="text-[10px] uppercase tracking-widest font-black text-primary flex items-center gap-1.5 mb-1">
                                <PartyPopper className="w-3 h-3" /> Badge Unlocked!
                            </span>
                            <h4 className="font-bold text-lg text-white leading-tight">{badge.name}</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-snug">{badge.description}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
