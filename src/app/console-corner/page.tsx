"use client";

import { useGamepad } from "@/hooks/useGamepad";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Gamepad2,
    ArrowLeft,
    Cpu,
    Monitor,
    Joystick,
    HardDrive,
    Zap,
    Lock,
    Settings,
    Play,
    LogOut
} from "lucide-react";
import Link from "next/link";

const SYSTEMS = [
    { id: 'nes', name: 'Nintendo Entertainment System', short: 'NES', color: '#ff4b4b', icon: '🎮' },
    { id: 'snes', name: 'Super Nintendo', short: 'SNES', color: '#a084e8', icon: '⭐' },
    { id: 'genesis', name: 'Sega Genesis', short: 'MD', color: '#4b73ff', icon: '🌀' },
    { id: 'gba', name: 'Game Boy Advance', short: 'GBA', color: '#4bff4b', icon: '🔋' },
    { id: 'n64', name: 'Nintendo 64', short: 'N64', color: '#ffb34b', icon: '🕹️' }
];

const CONSOLE_GAMES = [
    {
        id: 'sunset-riders',
        title: 'Sunset Riders',
        system: 'snes',
        url: 'https://www.retrogames.cc/embed/19970-sunset-riders.html',
        image: 'https://upload.wikimedia.org/wikipedia/en/2/2b/Sunset_Riders_SNES_cover.jpg',
        description: 'Bury me with my money! The classic Wild West run-and-gun.'
    },
    {
        id: 'super-mario-world',
        title: 'Super Mario World',
        system: 'snes',
        url: 'https://www.retrogames.cc/embed/44986-super-mario-world.html',
        image: 'https://upload.wikimedia.org/wikipedia/en/3/32/Super_Mario_World_Coverart.png',
        description: 'The definitive 16-bit platformer.'
    },
    {
        id: 'sonic-1',
        title: 'Sonic The Hedgehog',
        system: 'genesis',
        url: 'https://www.retrogames.cc/embed/22421-sonic-the-hedgehog.html',
        image: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Sonic_the_Hedgehog_1_Genesis_box_art.jpg',
        description: 'Blast processing in action.'
    }
];

export default function ConsoleCorner() {
    const { user } = useAuth();
    const router = useRouter();
    const { hasGamepadAccess, isGamepadConnected } = useGamepad();
    const [selectedSystem, setSelectedSystem] = useState<string | null>('snes');
    const [activeGame, setActiveGame] = useState<any>(null);

    // Redirect if they somehow get here without hardware access
    useEffect(() => {
        if (!hasGamepadAccess) {
            router.push('/');
        }
    }, [hasGamepadAccess, router]);

    // Gamepad Shortcut: L1 + R1 + L2 + R2 to exit game
    useEffect(() => {
        if (!activeGame) return;

        let interval = setInterval(() => {
            const gamepads = navigator.getGamepads();
            for (const gp of gamepads) {
                if (!gp) continue;

                // L1: 4, R1: 5, L2: 6, R2: 7
                const l1 = gp.buttons[4]?.pressed;
                const r1 = gp.buttons[5]?.pressed;
                const l2 = gp.buttons[6]?.pressed;
                const r2 = gp.buttons[7]?.pressed;

                if (l1 && r1 && l2 && r2) {
                    setActiveGame(null);
                    break;
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [activeGame]);

    if (!hasGamepadAccess) return null;

    const filteredGames = selectedSystem
        ? CONSOLE_GAMES.filter(g => g.system === selectedSystem)
        : CONSOLE_GAMES;

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            {/* Hero Header */}
            <div className="relative h-64 md:h-80 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-background to-background z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(102,252,241,0.1),transparent_70%)]" />

                <div className="container mx-auto px-6 relative z-20 h-full flex flex-col justify-end pb-8">
                    <Link href="/" className="flex items-center gap-2 text-primary hover:text-white transition-colors mb-6 w-fit group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Back to Dashboard</span>
                    </Link>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-primary/30">
                                    Hardware Mode Active
                                </div>
                                {isGamepadConnected && (
                                    <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-green-500/30 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        Gamepad Connected
                                    </div>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                                Console <span className="text-primary">Corner</span>
                            </h1>
                            <p className="text-muted-foreground mt-2 max-w-xl text-sm md:text-base font-medium">
                                Pro-grade emulation for handheld consoles and gamepad enthusiasts.
                                Optimize your experience with physical controls.
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <Gamepad2 className="w-32 h-32 text-white/5 -rotate-12 animate-pulsing-rgb" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
                {/* System Selection Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">Select System</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        {SYSTEMS.map((system) => (
                            <button
                                key={system.id}
                                onClick={() => setSelectedSystem(system.id)}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${selectedSystem === system.id ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(102,252,241,0.1)]' : 'bg-surface/30 border-white/5 text-muted-foreground hover:border-white/20'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{system.icon}</span>
                                    <span className="text-xs font-black uppercase tracking-widest">{system.short}</span>
                                </div>
                                {selectedSystem === system.id && <Zap className="w-3 h-3 animate-pulse" />}
                            </button>
                        ))}
                    </div>

                    <Card className="border-white/10 bg-surface/50 mt-8">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Cpu className="w-3 h-3 text-primary" /> System Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                                <span>Platform</span>
                                <span className="text-white">{SYSTEMS.find(s => s.id === selectedSystem)?.name}</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                                <span>Core</span>
                                <span className="text-primary-dim">Libretro</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Game Grid */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                            Available <span className="text-primary text-glow">Games</span>
                        </h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {filteredGames.length} Missions Identified
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredGames.map((game) => (
                            <Card
                                key={game.id}
                                className="group relative overflow-hidden bg-surface/30 border-white/5 hover:border-primary/50 transition-all duration-500 cursor-pointer flex flex-col h-full"
                                onClick={() => setActiveGame(game)}
                            >
                                <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
                                    <img
                                        src={game.image}
                                        alt={game.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(102,252,241,0.5)] transform scale-90 group-hover:scale-100 transition-transform">
                                            <Play className="w-6 h-6 text-black fill-black" />
                                        </div>
                                    </div>
                                </div>
                                <CardHeader className="p-4 flex-1">
                                    <CardTitle className="text-lg font-black uppercase tracking-tighter mb-1 group-hover:text-primary transition-colors">
                                        {game.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                                        {game.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}

                        {filteredGames.length === 0 && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <Monitor className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No ROMs detected for this system</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hardware Status Overlay (Bottom Left) */}
            <div className="fixed bottom-6 left-6 z-40">
                {!isGamepadConnected ? (
                    <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg backdrop-blur-md flex items-center gap-3 animate-fade-in-up">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Hardware Detection: Standby</span>
                    </div>
                ) : (
                    <div className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg backdrop-blur-md flex items-center gap-3 animate-fade-in-up">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">IO ACTIVE: PRO CONTROLLER CONNECTED</span>
                    </div>
                )}
            </div>

            {/* Emulator Overlay */}
            {activeGame && (
                <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-500">
                    <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-surface/90 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <Gamepad2 className="w-5 h-5 text-primary animate-pulsing-rgb" />
                            <div>
                                <span className="font-black text-sm text-white italic uppercase tracking-wider">{activeGame.title}</span>
                                <span className="ml-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{SYSTEMS.find(s => s.id === activeGame.system)?.short} Core</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-white hover:bg-white/10 font-bold uppercase tracking-widest text-[10px]"
                            onClick={() => setActiveGame(null)}
                        >
                            <LogOut className="w-4 h-4 mr-2" /> End Session
                        </Button>
                    </div>

                    <div className="flex-1 relative bg-black flex items-center justify-center">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                        {/* EmulatorJS Iframe Placeholder */}
                        <div className="relative w-full h-full max-w-5xl aspect-video bg-surface shadow-2xl border border-white/10 flex flex-col items-center justify-center overflow-hidden">
                            <iframe
                                src={activeGame.url}
                                className="w-full h-full border-0 select-none"
                                allow="autoplay; fullscreen; gamepad; focus-without-user-activation"
                            />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
