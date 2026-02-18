"use client";

import { useEffect, useState } from "react";
import { getGOTMReviews } from "@/lib/firestore-service";
import { Loader2, Gamepad2 } from "lucide-react";

export function GOTMHistoryModal({ gotm, onClose }: { gotm: any, onClose: () => void }) {
    const [isVisible, setIsVisible] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setIsVisible(true);
        const fetchReviews = async () => {
            try {
                const reviews = await getGOTMReviews(gotm.id);
                if (reviews.length === 0) {
                    setStats(null);
                } else {
                    const total = reviews.length;
                    const sums = reviews.reduce((acc: any, r: any) => ({
                        graphics: acc.graphics + (r.ratings.graphics || 0),
                        sound: acc.sound + (r.ratings.sound || 0),
                        gameplay: acc.gameplay + (r.ratings.gameplay || 0),
                        story: acc.story + (r.ratings.story || 0),
                        replayability: acc.replayability + (r.ratings.replayability || 0),
                        recommend: acc.recommend + (r.recommend ? 1 : 0)
                    }), { graphics: 0, sound: 0, gameplay: 0, story: 0, replayability: 0, recommend: 0 });

                    setStats({
                        graphics: (sums.graphics / total).toFixed(1),
                        sound: (sums.sound / total).toFixed(1),
                        gameplay: (sums.gameplay / total).toFixed(1),
                        story: (sums.story / total).toFixed(1),
                        replayability: (sums.replayability / total).toFixed(1),
                        recommendPercent: Math.round((sums.recommend / total) * 100),
                        totalReviews: total
                    });
                }
            } catch (e) {
                console.error("Error fetching stats:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [gotm.id]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 500);
    };

    return (
        <div
            className={`fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? 'opacity-100 backdrop-blur-xl' : 'opacity-0 pointer-events-none'}`}
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={handleClose}
        >
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] transition-all duration-1000 ${isVisible ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} />

            <div
                className={`relative max-w-sm w-full bg-surface/50 border border-purple-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)] transition-all duration-700 transform ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-20 scale-90 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <span className="text-xl">×</span>
                </button>

                <div className="relative mb-6 flex justify-center">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-2xl animate-pulse" />
                    <div className="relative w-32 h-48 rounded-lg border border-white/20 shadow-xl overflow-hidden bg-black/50">
                        {gotm.coverUrl ? (
                            <img src={gotm.coverUrl} alt={gotm.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                <Gamepad2 className="w-12 h-12 text-purple-400" />
                            </div>
                        )}
                    </div>
                </div>

                <h3 className="text-2xl font-black text-white italic tracking-tighter mb-1 uppercase text-center">
                    {gotm.title}
                </h3>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-[0.3em] mb-6 italic text-center">
                    {new Date(gotm.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>

                {loading ? (
                    <div className="py-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" /></div>
                ) : stats ? (
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-white/50 uppercase tracking-widest border-b border-white/5 pb-2 mb-4">Member Consensus</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                                <div className="text-[9px] uppercase font-black text-muted-foreground tracking-wider mb-1">Graphics</div>
                                <div className="flex items-end gap-1">
                                    <span className="text-2xl font-black text-white leading-none italic">{stats.graphics}</span>
                                    <span className="text-[10px] text-gray-500 font-bold mb-1">/5</span>
                                </div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                                <div className="text-[9px] uppercase font-black text-muted-foreground tracking-wider mb-1">Sound</div>
                                <div className="flex items-end gap-1">
                                    <span className="text-2xl font-black text-white leading-none italic">{stats.sound}</span>
                                    <span className="text-[10px] text-gray-500 font-bold mb-1">/5</span>
                                </div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                                <div className="text-[9px] uppercase font-black text-muted-foreground tracking-wider mb-1">Gameplay</div>
                                <div className="flex items-end gap-1">
                                    <span className="text-2xl font-black text-white leading-none italic">{stats.gameplay}</span>
                                    <span className="text-[10px] text-gray-500 font-bold mb-1">/5</span>
                                </div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                                <div className="text-[9px] uppercase font-black text-muted-foreground tracking-wider mb-1">Story</div>
                                <div className="flex items-end gap-1">
                                    <span className="text-2xl font-black text-white leading-none italic">{stats.story}</span>
                                    <span className="text-[10px] text-gray-500 font-bold mb-1">/5</span>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl border flex items-center justify-between ${stats.recommendPercent >= 70 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <div className="text-[10px] uppercase font-black text-white/70 tracking-wider">Recommended by</div>
                            <div className={`text-3xl font-black italic ${stats.recommendPercent >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                                {stats.recommendPercent}%
                            </div>
                        </div>

                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold text-center">
                            Based on {stats.totalReviews} Member Reviews
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm border border-dashed border-white/10 rounded-xl">
                        No reviews were submitted for this game.
                    </div>
                )}
            </div>
        </div>
    );
}
