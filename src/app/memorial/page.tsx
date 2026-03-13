"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMemo, type CSSProperties } from "react";

const NAMES = ["Valda", "Colin", "Brian", "Carol", "Darren"];

export default function MemorialPage() {
    const rockets = useMemo(() => {
        return Array.from({ length: 8 }).map((_, i) => {
            const name = NAMES[i % NAMES.length];
            const left = Math.random() * 90 + 5;
            const delay = Math.random() * 10;
            const duration = 9 + Math.random() * 4;
            const size = 0.85 + Math.random() * 0.5;
            const particles = Array.from({ length: 42 }).map((__, idx) => {
                const angle = Math.random() * Math.PI * 2;
                const radius = 20 + Math.random() * 90;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const pSize = 2 + Math.random() * 3.5;
                const alpha = 0.6 + Math.random() * 0.4;
                const drift = idx % 2 === 0 ? 1 : -1;
                return { x, y, pSize, alpha, drift };
            });
            return { id: i, name, left, delay, duration, size, particles };
        });
    }, []);

    return (
        <main className="relative min-h-screen bg-background overflow-hidden">
            <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors z-20">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>

            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 blur-[140px] rounded-full" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 blur-[140px] rounded-full" />
            </div>

            <div className="absolute inset-0 overflow-hidden z-10">
                {rockets.map((r) => (
                    <div
                        key={r.id}
                        className="rocket"
                        style={{
                            left: `${r.left}%`,
                            animationDuration: `${r.duration}s`,
                            animationDelay: `${r.delay}s`,
                            transform: `scale(${r.size})`,
                            ["--flight" as any]: `${r.duration}s`
                        }}
                    >
                        <div className="rocket-burst">
                            <div className="burst-name">{r.name}</div>
                            {r.particles.map((particle, idx) => (
                                <span
                                    key={`${r.id}-burst-${idx}`}
                                    style={
                                        {
                                            ["--x" as any]: `${particle.x}px`,
                                            ["--y" as any]: `${particle.y}px`,
                                            ["--size" as any]: `${particle.pSize}px`,
                                            ["--alpha" as any]: particle.alpha,
                                            ["--drift" as any]: particle.drift
                                        } as CSSProperties
                                    }
                                    aria-hidden="true"
                                />
                            ))}
                        </div>
                        <div className="rocket-trail" />
                    </div>
                ))}
            </div>

            <div className="absolute inset-x-0 top-20 z-20 flex justify-center px-6 text-center">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-slate-300/80">
                    A tribute to the ones we have loved and lost.
                </p>
            </div>

            <div className="absolute inset-x-0 bottom-10 z-20 flex justify-center px-6 text-center">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-slate-300/80">
                    A tribute to the ones we have loved and lost.
                </p>
            </div>

            <style jsx>{`
                .rocket {
                    position: absolute;
                    bottom: -20%;
                    animation-name: rise;
                    animation-timing-function: ease-in;
                    animation-iteration-count: infinite;
                    opacity: 0;
                    pointer-events: none;
                }

                .rocket-burst {
                    position: absolute;
                    top: -26px;
                    left: 50%;
                    width: 0;
                    height: 0;
                    transform: translateX(-50%);
                    animation: burst-cycle var(--flight) ease-out infinite;
                    opacity: 0;
                }

                .burst-name {
                    position: absolute;
                    left: 50%;
                    top: -8px;
                    transform: translateX(-50%) scale(0.7);
                    color: #ffffff;
                    font-weight: 800;
                    font-size: 14px;
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    text-shadow: 0 0 12px rgba(102, 252, 241, 0.4);
                    animation: name-cycle var(--flight) ease-out infinite;
                    opacity: 0;
                    white-space: nowrap;
                }

                .rocket-burst span {
                    position: absolute;
                    width: var(--size, 4px);
                    height: var(--size, 4px);
                    border-radius: 999px;
                    background: radial-gradient(circle, rgba(255, 140, 158, 0.95) 0%, rgba(255, 110, 136, 0.7) 45%, rgba(255, 110, 136, 0) 70%);
                    box-shadow: 0 0 12px rgba(255, 110, 136, 0.9), 0 0 24px rgba(255, 110, 136, 0.5);
                    opacity: 0;
                    animation: particle-cycle var(--flight) ease-out infinite;
                }

                .rocket-trail {
                    position: absolute;
                    left: 50%;
                    bottom: -60px;
                    width: 1px;
                    height: 55px;
                    transform: translateX(-50%);
                    background: linear-gradient(to top, rgba(255, 110, 136, 0.0), rgba(255, 110, 136, 0.65));
                    filter: drop-shadow(0 0 6px rgba(255, 110, 136, 0.6));
                }

                @keyframes rise {
                    0% {
                        transform: translateY(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    60% {
                        transform: translateY(-60vh);
                        opacity: 1;
                    }
                    75% {
                        transform: translateY(-68vh);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-78vh);
                        opacity: 0;
                    }
                }

                @keyframes burst-cycle {
                    0% {
                        transform: translateX(-50%) scale(0);
                        opacity: 0;
                    }
                    60% {
                        opacity: 0;
                    }
                    72% {
                        transform: translateX(-50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(-50%) scale(1.15);
                        opacity: 0;
                    }
                }

                @keyframes name-cycle {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) scale(0.6);
                    }
                    60% {
                        opacity: 0;
                        transform: translateX(-50%) scale(0.6);
                    }
                    72% {
                        opacity: 1;
                        transform: translateX(-50%) scale(1.05);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) scale(0.85);
                    }
                }

                @keyframes particle-cycle {
                    0% {
                        opacity: 0;
                        transform: translate(0, 0) scale(0.4);
                    }
                    60% {
                        opacity: 0;
                    }
                    72% {
                        opacity: var(--alpha, 1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(calc(var(--x, 0) + (8px * var(--drift, 1))), calc(var(--y, 0) - 8px)) scale(1.15);
                    }
                }
            `}</style>
        </main>
    );
}
