"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Gamepad2, Trophy, Loader2, Play, ChevronLeft, Star, ExternalLink, Zap } from 'lucide-react';
import Image from 'next/image';
import { addXp, markArcadeVisited, submitScore } from '@/lib/firestore-service';

// Mock Game Data
const ARCADE_GAMES = [
    {
        id: 'pacman',
        title: 'Pac-Man',
        platform: 'Arcade',
        image: '/pacman/shots/pac.png',
        url: '/pacman/index.html',
        description: 'The ultimate arcade classic. Race through the maze, eat dots, and dodge ghosts!',
        tags: ['Classic', 'Maze', 'Retro'],
        difficulty: 'Medium'
    },
    {
        id: 'hextris',
        title: 'Hextris',
        platform: 'Web',
        image: '/images/hextris.png',
        url: 'https://hextris.io/',
        description: 'An addictive puzzle game inspired by Tetris. Spin the hexagon and match colors!',
        tags: ['Puzzle', 'Skills', 'Neon'],
        difficulty: 'Medium'
    },
    {
        id: 'tetris',
        title: 'Tetris',
        platform: 'Web',
        image: '/images/tetris.jpg',
        url: 'https://tetris.com/play-tetris',
        description: 'The world-famous puzzle game. Arrange falling blocks to clear lines and score high!',
        tags: ['Puzzle', 'Retro', 'Classic'],
        difficulty: 'Medium'
    },
    {
        id: 'spaceinvaders',
        title: 'Space Invaders',
        platform: 'Web',
        image: '/images/space-invaders.png',
        url: 'https://freeinvaders.org/',
        description: 'Defend the earth from waves of descending aliens in this 1978 arcade legend!',
        tags: ['Retro', 'Shooter', 'Action'],
        difficulty: 'Hard'
    }
];

export default function ArcadePage() {
    const { user } = useAuth();
    const [activeGame, setActiveGame] = useState<typeof ARCADE_GAMES[0] | null>(null);
    const [isSubmittingScore, setIsSubmittingScore] = useState(false);

    useEffect(() => {
        // Mark arcade as visited for the Rookie Quest
        if (user) {
            const visited = localStorage.getItem('arcade_visited') === 'true';
            if (!visited) {
                addXp(user.uid, 25, "Arcade Explorer Quest");
                markArcadeVisited(user.uid);
                localStorage.setItem('arcade_visited', 'true');
            }
        }

        const handleMessage = async (event: MessageEvent) => {
            // Listen for scores from Pacman
            if (event.data && (event.data.type === 'PACMAN_SCORE' || event.data.type === 'FEEDER_SCORE')) {
                const rawScore = event.data.score;
                const score = typeof rawScore === 'string' ? parseInt(rawScore, 10) : Number(rawScore);

                console.log("🎮 Score message received:", event.data.type, "Score:", score);

                if (user && !isNaN(score) && score > 0) {
                    setIsSubmittingScore(true);
                    try {
                        const FEEDER_SESSION_ID = "feeder-club-6-month-pacman";
                        // Use the shared submitScore logic which handles improved scores and outliers
                        const result = await submitScore(
                            FEEDER_SESSION_ID,
                            user.uid,
                            score,
                            user.displayName || "Unknown Rookie"
                        );

                        if (result.improved) {
                            console.log("✅ Pacman score submitted successfully!", score);
                        } else {
                            console.log("📉 Score not higher than current best, skipping submission.");
                        }
                    } catch (error) {
                        console.error("❌ Error submitting score:", error);
                    } finally {
                        setIsSubmittingScore(false);
                    }
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
            // If the component unmounts, we should probably stop the game
            setActiveGame(null);
        };
    }, [user]);

    return (
        <main className="min-h-screen pt-24 pb-20 px-4 container mx-auto">
            {/* Header */}
            <div className="mb-12 text-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -z-10" />
                <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-4 flex items-center justify-center gap-4">
                    <Gamepad2 className="w-12 h-12 md:w-20 md:h-20 text-primary animate-pulse" />
                    The Arcade
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Classic games, high scores, and eternal glory. Play for fun or compete for the club leaderboard.
                </p>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ARCADE_GAMES.map((game) => (
                    <Card key={game.id} className="group relative overflow-hidden border-white/5 bg-surface/40 hover:border-primary/50 transition-all duration-500 hover:-translate-y-1">
                        {/* Game Image */}
                        <div className="relative h-48 w-full overflow-hidden">
                            <Image
                                src={game.image}
                                alt={game.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60" />

                            {/* Difficulty Badge */}
                            <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                <Zap className={`w-3 h-3 ${game.difficulty === 'Hard' ? 'text-red-400' : game.difficulty === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`} />
                                <span className="text-[10px] font-bold text-white uppercase">{game.difficulty}</span>
                            </div>
                        </div>

                        {/* Game Info */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-black text-white tracking-tight italic uppercase">{game.title}</h3>
                                <span className="text-xs font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{game.platform}</span>
                            </div>
                            <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
                                {game.description}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {game.tags.map(tag => (
                                        <span key={tag} className="text-[10px] uppercase font-bold text-white/40">{tag}</span>
                                    ))}
                                </div>
                                <Button
                                    onClick={() => setActiveGame(game)}
                                    className="bg-primary hover:bg-white text-black font-black italic transition-all group-hover:px-8"
                                >
                                    PLAY NOW
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Game Modal */}
            {activeGame && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-surface/50">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setActiveGame(null)}
                                className="text-white hover:bg-white/10 rounded-full"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </Button>
                            <div>
                                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{activeGame.title}</h2>
                                <p className="text-xs text-primary font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    Live Session
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isSubmittingScore && (
                                <div className="flex items-center gap-2 text-primary font-bold animate-pulse text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    SYNCING SCORE...
                                </div>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveGame(null)}
                                className="border-white/10 text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
                            >
                                EXIT ARCADE
                            </Button>
                        </div>
                    </div>

                    {/* Game Viewport */}
                    <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                        <iframe
                            src={activeGame.url}
                            className="w-full h-full border-none shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                            title={activeGame.title}
                            allow="autoplay; gamepad; keyboard"
                        />
                    </div>
                </div>
            )}
        </main>
    );
}
