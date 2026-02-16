"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeType = 'cyber' | 'sunset' | 'deepsea' | 'matrix' | 'vampire' | 'midnight';
export type BgType = 'connectivity' | 'galaxy' | 'pacman' | 'aurora' | 'retrogrid';

interface ThemeContextType {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    bgType: BgType;
    setBgType: (type: BgType) => void;
    rgbEnabled: boolean;
    setRgbEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'cyber',
    setTheme: () => { },
    bgType: 'connectivity',
    setBgType: () => { },
    rgbEnabled: true,
    setRgbEnabled: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setThemeState] = useState<ThemeType>('cyber');
    const [bgType, setBgTypeState] = useState<BgType>('connectivity');
    const [rgbEnabled, setRgbEnabledState] = useState(true);

    // Load from local storage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme') as ThemeType;
        const savedBg = localStorage.getItem('app-bg-type') as BgType;
        const savedRgb = localStorage.getItem('app-rgb');

        if (savedTheme) setThemeState(savedTheme);
        if (savedBg) setBgTypeState(savedBg);
        if (savedRgb !== null) setRgbEnabledState(savedRgb === 'true');
    }, []);

    const setTheme = (newTheme: ThemeType) => {
        setThemeState(newTheme);
        localStorage.setItem('app-theme', newTheme);
    };

    const setBgType = (newBg: BgType) => {
        setBgTypeState(newBg);
        localStorage.setItem('app-bg-type', newBg);
    };

    const setRgbEnabled = (enabled: boolean) => {
        setRgbEnabledState(enabled);
        localStorage.setItem('app-rgb', String(enabled));
    };

    // Apply theme and RGB classes to body
    useEffect(() => {
        const body = document.body;
        // Remove all theme classes
        const themes: ThemeType[] = ['cyber', 'sunset', 'deepsea', 'matrix', 'vampire', 'midnight'];
        themes.forEach(t => body.classList.remove(`theme-${t}`));

        // Add current theme
        body.classList.add(`theme-${theme}`);

        // Handle RGB
        if (rgbEnabled) {
            body.classList.remove('no-rgb');
        } else {
            body.classList.add('no-rgb');
        }
    }, [theme, rgbEnabled]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, bgType, setBgType, rgbEnabled, setRgbEnabled }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
