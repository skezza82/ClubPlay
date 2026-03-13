'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Gamepad2, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface Achievement {
    id: number;
    title: string;
    description: string;
    points: number;
    badgeName: string; // The badge image ID from RetroAchievements
    date: string;
    gameTitle: string;
}

interface RetroAchievementsWidgetProps {
    raUsername: string;
}

export default function RetroAchievementsWidget({ raUsername }: RetroAchievementsWidgetProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!raUsername) return;

        const fetchAchievements = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // The base URL for functions is usually https://REGION-PROJECT_ID.cloudfunctions.net/
                // We'll use the one from .env if available, or default to the project's standard URL
                const baseUrl = process.env.NEXT_PUBLIC_FUNCTIONS_URL?.replace('/searchGames', '') ||
                    'https://us-central1-club-play-app.cloudfunctions.net';

                const response = await fetch(`${baseUrl}/getRecentAchievements?username=${encodeURIComponent(raUsername)}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch from RetroAchievements');
                }
                const data = await response.json();

                // Map the data to our interface based on the API response shape
                // The @retroachievements/api getUserRecentAchievements returns an array of objects
                const mapped = data.map((a: any) => ({
                    id: a.achievementId,
                    title: a.title,
                    description: a.description,
                    points: Math.max(a.points || 0, a.hardcoreMode ? (a.points || 0) * 2 : 0),
                    badgeName: a.badgeName,
                    date: a.date,
                    gameTitle: a.gameTitle,
                }));

                setAchievements(mapped);
            } catch (err: any) {
                console.error("RA Fetch Error:", err);
                setError("Unable to sync RetroAchievements. Check if the username is correct or try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAchievements();
    }, [raUsername]);

    if (!raUsername) return null;

    return (
        <Card className="border-white/5 bg-slate-900/60 backdrop-blur-md overflow-hidden relative group">
            <CardHeader className="border-b border-white/5 pb-4 bg-slate-950/40">
                <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter text-emerald-400">
                    <Gamepad2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    RetroAchievements
                    <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 ml-auto lowercase">
                        @{raUsername}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-slate-900/40">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-emerald-400 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Syncing Hardcore Data...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-8 text-rose-400 gap-3 text-center">
                        <AlertCircle className="w-8 h-8 opacity-50 mb-2" />
                        <span className="text-xs font-bold leading-relaxed">{error}</span>
                    </div>
                ) : achievements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-3 text-center">
                        <Gamepad2 className="w-8 h-8 mb-2 opacity-30" />
                        <span className="text-xs font-bold">No achievements earned in the last 30 days.</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {achievements.map((ach) => (
                            <div key={`${ach.id}-${ach.date}`} className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                                {/* RA Badge Images URL: https://media.retroachievements.org/Badge/{BadgeName}.png */}
                                <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shadow-md">
                                    <img
                                        src={`https://media.retroachievements.org/Badge/${ach.badgeName}.png`}
                                        alt={ach.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-badge.png' }}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h4 className="font-bold text-sm text-white truncate">{ach.title}</h4>
                                        <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 shrink-0">
                                            {ach.points}pt
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-tight mb-1.5 truncate">
                                        {ach.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-wider truncate">
                                            {ach.gameTitle}
                                        </p>
                                        <p className="text-[9px] text-slate-500 uppercase shrink-0">
                                            {new Date(ach.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
