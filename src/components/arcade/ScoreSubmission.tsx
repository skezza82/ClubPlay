"use client";

import { Button } from "@/components/ui/Button";
import { Upload, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { submitScore } from "@/lib/arcade";

interface ScoreSubmissionProps {
    score: number;
    gameId: string;
    onPlayAgain: () => void;
    onScoreSubmitted: () => void;
}

export function ScoreSubmission({ score, gameId, onPlayAgain, onScoreSubmitted }: ScoreSubmissionProps) {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!user || submitting || submitted) return;

        setSubmitting(true);
        try {
            await submitScore({
                gameId,
                userId: user.uid,
                userDisplayName: user.displayName || "Unknown Player",
                userPhotoURL: user.photoURL,
                score
            });
            setSubmitted(true);
            onScoreSubmitted(); // Refresh leaderboard
        } catch (error) {
            console.error("Failed to submit score", error);
            alert("Failed to submit score. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full mx-auto text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl font-black italic uppercase text-white mb-2 tracking-tighter">
                Game Over
            </h2>
            <div className="text-6xl font-mono font-bold text-primary mb-8 neon-text">
                {score.toLocaleString()}
            </div>

            <div className="space-y-4">
                {!user ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                        <p className="text-red-400 text-sm">Sign in to save your score to the leaderboard!</p>
                    </div>
                ) : submitted ? (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                        <p className="text-green-400 font-bold">Score Submitted!</p>
                    </div>
                ) : (
                    <Button
                        size="lg"
                        className="w-full font-bold text-lg uppercase tracking-wide"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? "Saving..." : (
                            <>
                                <Upload className="w-5 h-5 mr-2" />
                                Submit Score
                            </>
                        )}
                    </Button>
                )}

                <Button
                    variant="outline"
                    size="lg"
                    className="w-full uppercase tracking-wide"
                    onClick={onPlayAgain}
                >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Play Again
                </Button>
            </div>
        </div>
    );
}
