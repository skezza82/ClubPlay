"use client";

import { useEffect, useState } from "react";
import { getTopScores, HighScore } from "@/lib/arcade";
import { Trophy, Medal, User as UserIcon } from "lucide-react";
import Image from "next/image";

interface HighScoresProps {
    gameId: string;
}

export function HighScores({ gameId }: HighScoresProps) {
    const [scores, setScores] = useState<HighScore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            setLoading(true);
            const data = await getTopScores(gameId);
            setScores(data);
            setLoading(false);
        };

        fetchScores();
    }, [gameId]);

    if (loading) {
        return <div className="text-center text-muted-foreground animate-pulse">Loading leaderboards...</div>;
    }

    if (scores.length === 0) {
        return (
            <div className="text-center p-8 border border-white/10 rounded-xl bg-surface/30">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No high scores yet. Be the first!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Leaderboard
            </h3>

            <div className="space-y-2">
                {scores.map((score, index) => (
                    <div
                        key={score.id || index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${index === 0 ? "bg-yellow-500/10 border-yellow-500/50" :
                                index === 1 ? "bg-gray-400/10 border-gray-400/50" :
                                    index === 2 ? "bg-amber-700/10 border-amber-700/50" :
                                        "bg-surface/30 border-white/5"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${index === 0 ? "bg-yellow-500 text-black" :
                                    index === 1 ? "bg-gray-400 text-black" :
                                        index === 2 ? "bg-amber-700 text-white" :
                                            "bg-white/10 text-white/50"
                                }`}>
                                {index + 1}
                            </div>

                            <div className="flex items-center gap-2">
                                {score.userPhotoURL ? (
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10">
                                        <Image
                                            src={score.userPhotoURL}
                                            alt={score.userDisplayName}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <UserIcon className="w-4 h-4 text-primary" />
                                    </div>
                                )}
                                <span className={`font-medium ${index < 3 ? "text-white" : "text-gray-300"}`}>
                                    {score.userDisplayName || "Anonymous"}
                                </span>
                            </div>
                        </div>

                        <div className="font-mono font-bold text-lg text-primary">
                            {score.score.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
