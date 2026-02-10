"use client";

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// Placeholder for development/web - AdMob disabled
export function AdBanner() {
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    if (isNative) {
        // Just show a small spacer when native if AdMob is disabled
        return <div className="h-[20px] w-full bg-transparent" />;
    }

    return (
        <div className="w-full h-[50px] bg-black/20 border-t border-white/5 flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Ad Space (Disabled)
        </div>
    );
}
