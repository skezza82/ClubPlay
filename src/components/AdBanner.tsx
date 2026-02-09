"use client";

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// Placeholder for development/web
export function AdBanner() {
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());

        // Initialize AdMob if native
        const initAdMob = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    await AdMob.initialize({
                        // requestTrackingAuthorization: true,
                        // testingDevices: ['YOUR_TEST_DEVICE_ID'],
                        initializeForTesting: true,
                    });
                    await AdMob.showBanner({
                        adId: 'ca-app-pub-3940256099942544/6300978111', // Test ID
                        adSize: BannerAdSize.BANNER,
                        position: BannerAdPosition.BOTTOM_CENTER,
                        margin: 0,
                    });
                } catch (e) {
                    console.error("AdMob failed to init", e);
                }
            }
        };

        initAdMob();

        return () => {
            if (Capacitor.isNativePlatform()) {
                AdMob.hideBanner().catch(console.error);
            }
        };
    }, []);

    if (isNative) {
        // Native ads are handled by the plugin and overlay the webview
        return <div className="h-[50px] w-full bg-transparent" />; // Spacer
    }

    return (
        <div className="w-full h-[50px] bg-black/20 border-t border-white/5 flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Ad Space (Web Preview)
        </div>
    );
}
