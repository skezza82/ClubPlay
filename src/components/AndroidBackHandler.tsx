"use client";

import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export function AndroidBackHandler() {
    const router = useRouter();
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);

    // Keep ref synchronized with current pathname
    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        // Only run on Capacitor/Android
        if (!Capacitor.isNativePlatform()) return;

        let listenerHandle: any = null;

        const setupListener = async () => {
            listenerHandle = await App.addListener('backButton', (data) => {
                // If we can go back in app history
                // Determine "root" pages where back button should probably exit (or minimize)
                const isRoot = pathnameRef.current === '/' ||
                    pathnameRef.current === '/login' ||
                    pathnameRef.current === '/profile' ||
                    pathnameRef.current === '/welcome';

                if (!isRoot) {
                    // Navigate back in Next.js router
                    router.back();
                } else {
                    // If on root page, exit or minimize. 
                    // App.exitApp() is the standard "close" behavior.
                    App.exitApp();
                }
            });
        };

        setupListener();

        return () => {
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, [router]); // Router stable, run once-ish

    return null;
}
