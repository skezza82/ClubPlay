"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PWAContextType {
    deferredPrompt: any;
    isInstallable: boolean;
    install: () => Promise<void>;
    dismiss: () => void;
    isIOS: boolean;
    isInstalled: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            setIsInstalled(isStandalone);
        }

        checkInstalled();
        window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);

        // Check for early captured event
        if ((window as any).deferredPrompt) {
            console.log("Found early captured PWA prompt");
            setDeferredPrompt((window as any).deferredPrompt);
            (window as any).deferredPrompt = null;
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log("PWA Install Prompt captured");
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const dismiss = () => {
        setDeferredPrompt(null);
    }

    return (
        <PWAContext.Provider value={{ deferredPrompt, isInstallable: !!deferredPrompt, install, dismiss, isIOS, isInstalled }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error("usePWA must be used within a PWAProvider");
    }
    return context;
}
