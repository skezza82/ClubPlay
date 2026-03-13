"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Gamepad2, Trophy, Loader2, Play, ChevronLeft, Star, ExternalLink, Zap } from 'lucide-react';
import Image from 'next/image';
import { addXp, markArcadeVisited, submitScore, getTotalUsersCount } from '@/lib/firestore-service';

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
    const [activeLegends, setActiveLegends] = useState<number | null>(null);

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

    useEffect(() => {
        const loadActiveLegends = async () => {
            try {
                const count = await getTotalUsersCount();
                setActiveLegends(count);
            } catch (e) {
                console.error("Failed to load active legends count:", e);
            }
        };
        loadActiveLegends();
    }, []);

    return (
        <main className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto relative overflow-hidden">
            {/* Header Area */}
            <div className="mb-16 text-center lg:text-left relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="relative group">
                    <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -z-10 group-hover:bg-primary/30 transition-colors duration-700" />
                    <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter mb-4 flex items-center lg:justify-start justify-center gap-6">
                        <Gamepad2 className="w-16 h-16 md:w-24 md:h-24 text-primary drop-shadow-[0_0_15px_rgba(102,252,241,0.5)]" />
                        Arcade
                    </h1>
                    <p className="text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 font-medium tracking-wide">
                        Classic gaming. High score glory. Independent challenges built for the club.
                    </p>
                </div>

                <div className="flex items-center gap-4 premium-glass p-2 rounded-[2rem] border-white/10">
                    <div className="px-6 py-4">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Global Legends Active</div>
                        <div className="text-white font-black italic flex items-center gap-2 text-2xl">
                            <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]" />
                            {activeLegends !== null ? `${activeLegends.toLocaleString()} ACTIVE` : "—"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Divider Style from Mockup */}
            <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Available Challenges</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {ARCADE_GAMES.map((game) => (
                    <Card key={game.id} className="group border-none relative bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-500">
                        {/* Game Image */}
                        <div className="relative h-56 w-full">
                            <Image
                                src={game.image}
                                alt={game.title}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                            {/* Difficulty Badge */}
                            <div className="absolute top-6 right-6 flex items-center gap-1 bg-black/80 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-xl">
                                <Zap className={`w-3.5 h-3.5 ${game.difficulty === 'Hard' ? 'text-rose-400' : game.difficulty === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`} />
                                <span className="text-[11px] font-bold text-white uppercase tracking-wider">{game.difficulty}</span>
                            </div>
                        </div>

                        {/* Game Info */}
                        <div className="p-8 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-3xl font-black text-white tracking-tight italic uppercase group-hover:text-primary transition-colors">{game.title}</h3>
                                <span className="text-[10px] font-black text-primary/80 bg-primary/5 px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest">{game.platform}</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed line-clamp-2">
                                {game.description}
                            </p>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex gap-3">
                                    {game.tags.map(tag => (
                                        <span key={tag} className="text-[10px] uppercase font-black text-slate-600 tracking-tighter">{tag}</span>
                                    ))}
                                </div>
                                <Button
                                    onClick={() => setActiveGame(game)}
                                    className="glass-button bg-primary/10 hover:bg-primary text-primary hover:text-black font-black italic px-8 transition-all duration-300"
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
                <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-2xl flex flex-col animate-in fade-in zoom-in-95 duration-500">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 md:px-8 md:py-6 border-b border-white/5 premium-glass">
                        <div className="flex items-center gap-6">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setActiveGame(null)}
                                className="text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl w-12 h-12"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </Button>
                            <div>
                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">{activeGame.title}</h2>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        Secure Session Active
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Competition enabled</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isSubmittingScore && (
                                <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 text-primary font-black italic text-xs animate-pulse">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    SYNCING DATA...
                                </div>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => setActiveGame(null)}
                                className="border-white/10 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/50 rounded-2xl h-12 px-6 font-bold"
                            >
                                CLOSE SESSION
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
