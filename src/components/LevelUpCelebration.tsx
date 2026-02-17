"use client";

import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, Star } from 'lucide-react';
import { Button } from './ui/Button';

interface LevelUpCelebrationProps {
    level: number;
    onClose: () => void;
}

export function LevelUpCelebration({ level, onClose }: LevelUpCelebrationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger show animation
        setIsVisible(true);

        // Auto-close after 8 seconds if user doesn't click
        const timer = setTimeout(() => {
            handleClose();
        }, 8000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Wait for fade out
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? 'opacity-100 backdrop-blur-xl' : 'opacity-0 pointer-events-none'
                }`}
            style={{ background: 'rgba(0,0,0,0.85)' }}
        >
            {/* Celebration Glow Background */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] transition-all duration-1000 ${isVisible ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} />

            <div className={`relative max-w-sm w-full bg-surface/50 border border-primary/30 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] transition-all duration-700 transform ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-20 scale-90 opacity-0'}`}>

                {/* Decorative Icons */}
                <div className="absolute top-4 left-4 text-primary opacity-50 animate-bounce">
                    <Star className="w-6 h-6 fill-primary" />
                </div>
                <div className="absolute top-12 right-8 text-primary opacity-40 animate-pulse">
                    <Sparkles className="w-5 h-5" />
                </div>

                {/* Trophy Section */}
                <div className="relative mb-8 flex justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg border border-white/20 transform -rotate-6 animate-float">
                        <Trophy className="w-12 h-12 text-white" />
                    </div>
                </div>

                {/* Text Content */}
                <h2 className="text-sm font-black text-primary uppercase tracking-[0.5em] mb-2 drop-shadow-sm">Level Up!</h2>
                <h3 className="text-6xl font-black text-white italic tracking-tighter mb-6 flex items-center justify-center gap-2">
                    <span className="text-primary text-2xl uppercase tracking-tighter font-bold not-italic align-middle">LVL</span>
                    {level}
                </h3>

                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    Nicely done! You've unlocked major progression. Keep playing to earn more XP and dominate the leaderboard!
                </p>

                <Button
                    onClick={handleClose}
                    className="w-full bg-primary hover:bg-primary-dim text-white font-black uppercase tracking-[0.2em] py-6 rounded-xl text-lg shadow-[0_4px_20px_rgba(var(--primary-rgb),0.4)] transition-all active:scale-95"
                >
                    Get Back In
                </Button>

                {/* Particle Effect Overlay (Simulated with few stars) */}
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-primary/30 animate-ping"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    >
                        <Star className="w-2 h-2 fill-current" />
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(-6deg); }
                    50% { transform: translateY(-10px) rotate(6deg); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
