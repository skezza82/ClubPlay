"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "./ui/Button";
import { usePWA } from "@/context/PWAContext";

export function InstallPrompt() {
    const { deferredPrompt, install, isIOS: contextIsIOS, dismiss } = usePWA();
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        setIsIOS(contextIsIOS);

        if (deferredPrompt) {
            const dismissed = sessionStorage.getItem("pwa-prompt-dismissed");
            if (!dismissed) {
                setIsVisible(true);
            }
        }

        // For iOS, we check more frequently or show if not standalone
        // Note: isIOS from context is static, so we might want to check display-mode here still
        if (contextIsIOS && !window.matchMedia('(display-mode: standalone)').matches) {
            const dismissed = sessionStorage.getItem("pwa-prompt-dismissed");
            if (!dismissed) {
                setIsVisible(true);
            }
        }

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

    }, [deferredPrompt, contextIsIOS]);

    const handleInstallClick = async () => {
        await install();
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem("pwa-prompt-dismissed", "true");
        dismiss(); // Optional: clear prompt from context if you want to hide it globally until reload, but mostly we just hide UI
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-[200] animate-fade-in-down">
            <div className="bg-[#0b0c10]/80 backdrop-blur-2xl border border-primary/40 rounded-2xl p-4 shadow-[0_0_50px_rgba(102,252,241,0.2)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary/20 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
                            <Download className="w-6 h-6 relative z-10" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-sm uppercase tracking-tighter">Install ClubPlay</h4>
                            <p className="text-xs text-primary/70 font-bold uppercase tracking-widest text-[10px]">Level up your experience</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-2 text-white/20 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isIOS ? (
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                        <p className="text-white text-xs leading-relaxed mb-3">
                            To install on iOS: Tap <span className="inline-block px-1 border border-white/20 rounded bg-white/5 mx-1 font-bold italic">Share</span> then select <span className="text-primary font-bold italic">"Add to Home Screen"</span>
                        </p>
                        <div className="flex justify-center">
                            <div className="w-6 h-6 border-b-2 border-r-2 border-primary rotate-45 animate-bounce mb-2" />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="text-white/60 text-xs italic">
                            Install to get fullscreen mode, offline access, and faster loading.
                        </p>
                        <Button
                            onClick={handleInstallClick}
                            className="w-full bg-primary text-black font-black uppercase italic tracking-[0.2em] h-12 text-sm neon-border active:scale-95 transition-all"
                        >
                            ADD TO HOME SCREEN
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
