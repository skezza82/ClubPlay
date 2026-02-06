"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Gamepad2, LogOut, Play, Zap, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ArcadeGame {
    id: string;
    title: string;
    description: string;
    url: string;
    image: string;
    publisher: string;
}

const GAMES: ArcadeGame[] = [
    {
        id: "tetris",
        title: "Tetris",
        description: "The addictive puzzle game that started it all.",
        url: "https://play.tetris.com/",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Tetris_logo_2019.svg/2560px-Tetris_logo_2019.svg.png",
        publisher: "Tetris.com"
    }
];

export default function ArcadePage() {
    const [activeGame, setActiveGame] = useState<ArcadeGame | null>(null);

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
                    No coins required. Play classic browser games instantly.
                </p>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {GAMES.map((game) => (
                    <Card
                        key={game.id}
                        className="group overflow-hidden border-white/10 bg-surface/50 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]"
                        onClick={() => setActiveGame(game)}
                    >
                        <div className="aspect-video bg-black relative overflow-hidden">
                            <Image
                                src={game.image}
                                alt={game.title}
                                fill
                                className="object-contain p-8 group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <Button className="text-lg font-black italic uppercase tracking-widest neon-border scale-90 group-hover:scale-100 transition-transform">
                                    <Play className="w-5 h-5 mr-2" /> Play Now
                                </Button>
                            </div>
                            {/* Publisher Badge */}
                            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase text-white/50 border border-white/10">
                                {game.publisher}
                            </div>
                        </div>
                        <CardHeader className="relative">
                            <div className="absolute top-0 transform -translate-y-1/2 right-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg group-hover:bg-white transition-colors">
                                <Zap className="w-5 h-5 text-black" />
                            </div>
                            <CardTitle className="text-2xl font-black text-white italic uppercase">{game.title}</CardTitle>
                            <CardDescription className="text-white/60">{game.description}</CardDescription>
                        </CardHeader>
                    </Card>
                ))}

                {/* Coming Soon Card */}
                <Card className="border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center min-h-[300px] text-muted-foreground group">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Trophy className="w-6 h-6 opacity-30" />
                    </div>
                    <p className="font-bold uppercase tracking-widest text-xs opacity-50">More Games Coming Soon</p>
                </Card>
            </div>

            {/* Game Modal */}
            {activeGame && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                    {/* Modal Header */}
                    <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface/50">
                        <div className="flex items-center gap-3">
                            <Gamepad2 className="w-6 h-6 text-primary" />
                            <span className="font-black text-lg text-white italic uppercase tracking-wider">{activeGame.title}</span>
                        </div>
                        <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-white hover:bg-white/10"
                            onClick={() => setActiveGame(null)}
                        >
                            <span className="mr-2 text-xs font-bold uppercase tracking-widest hidden sm:inline-block">Exit Arcade</span>
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Game Viewport */}
                    <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                        <iframe
                            src={activeGame.url}
                            className="w-full h-full border-0 select-none"
                            allow="autoplay; fullscreen; gamepad; focus-without-user-activation"
                        />
                    </div>
                </div>
            )}
        </main>
    );
}
