"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Gamepad2, LogOut, Play } from "lucide-react";
// Tetris import removed


import { useAuth } from "@/context/AuthContext";
import { addXp, markArcadeVisited } from "@/lib/firestore-service";
import dynamic from "next/dynamic";

const ArcadeCarousel = dynamic(() => import('@/components/3d/ArcadeCarousel'), { ssr: false });

export interface ArcadeGame {
    id: string;
    title: string;
    description: string;
    url?: string;
    image: string;
    publisher: string;
    type: 'iframe' | 'local';
}

const GAMES: ArcadeGame[] = [
    {
        id: "tetris",
        title: "Tetris",
        description: "The addictive puzzle game that started it all.",
        url: "https://tetris.com/play-tetris",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Tetris_logo_2019.svg/2560px-Tetris_logo_2019.svg.png",
        publisher: "Tetris.com",
        type: 'iframe'
    },
    {
        id: "pacman",
        title: "Pac-Man",
        description: "Navigate the maze, eat all the dots, and avoid the ghosts!",
        url: "https://freepacman.org/",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Pac_Man.svg/1200px-Pac_Man.svg.png",
        publisher: "FreePacman",
        type: 'iframe'
    },
    {
        id: "hextris",
        title: "Hextris",
        description: "An addictive puzzle game inspired by Tetris.",
        url: "https://hextris.io/",
        image: "/images/hextris.png",
        publisher: "Hextris.io",
        type: 'iframe'
    },
    {
        id: "space-invaders",
        title: "Space Invaders",
        description: "Defend Earth from the alien invasion in this arcade classic.",
        url: "https://funhtml5games.com/spaceinvaders/index.html",
        image: "/images/space-invaders.png",
        publisher: "FunHTML5Games",
        type: 'iframe'
    }
];

export default function ArcadePage() {
    const [activeGameId, setActiveGameId] = useState<string | null>(null);
    const [playingGame, setPlayingGame] = useState<ArcadeGame | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        // Mark arcade as visited for the Rookie Quest
        const visited = localStorage.getItem('arcade_visited') === 'true';
        if (!visited && user) {
            addXp(user.uid, 25, "Arcade Explorer Quest");
            markArcadeVisited(user.uid); // Persist to Firestore
            localStorage.setItem('arcade_visited', 'true');
        }
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
                    No coins required. Play classic games instantly.
                </p>
            </div>

            {/* Arcade 3D Carousel */}
            <div className="w-full relative h-[60vh] md:h-[70vh]">
                <ArcadeCarousel
                    games={GAMES}
                    activeGameId={activeGameId}
                    setActiveGameId={setActiveGameId}
                    onPlay={setPlayingGame}
                />

                {/* Play Button Overlay */}
                {activeGameId && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-fade-in-up flex flex-col items-center gap-4 pointer-events-none">
                        <Button
                            className="text-lg font-black italic uppercase tracking-widest neon-border h-14 px-8 shadow-[0_0_30px_rgba(124,58,237,0.5)] pointer-events-auto hover:scale-105 hover:bg-white hover:text-black transition-all group animate-pulse-slow"
                            onClick={() => {
                                const game = GAMES.find(g => g.id === activeGameId);
                                if (game) setPlayingGame(game);
                            }}
                        >
                            <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                            Play {GAMES.find(g => g.id === activeGameId)?.title}
                        </Button>
                    </div>
                )}
            </div>

            {/* Game Modal */}
            {playingGame && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                    {/* Modal Header */}
                    <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface/50">
                        <div className="flex items-center gap-3">
                            <Gamepad2 className="w-6 h-6 text-primary" />
                            <span className="font-black text-lg text-white italic uppercase tracking-wider">{playingGame.title}</span>
                        </div>
                        <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-white hover:bg-white/10"
                            onClick={() => setPlayingGame(null)}
                        >
                            <span className="mr-2 text-xs font-bold uppercase tracking-widest hidden sm:inline-block">Exit Arcade</span>
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Game Viewport */}
                    <div className="flex-1 bg-black/50 relative flex items-center justify-center p-0 pb-8 md:p-4 md:pb-4 overflow-hidden safe-area-bottom">
                        <iframe
                            src={playingGame.url}
                            className="w-full h-full border-0 select-none bg-black"
                            allow="autoplay; fullscreen; gamepad; focus-without-user-activation"
                        />
                    </div>
                </div>
            )}
        </main>
    );
}
