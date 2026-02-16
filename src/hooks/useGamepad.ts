"use client";

import { useState, useEffect } from "react";

export function useGamepad() {
    const [isGamepadConnected, setIsGamepadConnected] = useState(() => {
        if (typeof navigator !== "undefined" && navigator.getGamepads) {
            const gamepads = navigator.getGamepads();
            return !!Array.from(gamepads).find(gp => gp !== null);
        }
        return false;
    });
    const [testingMode, setTestingMode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("console_corner_testing") === "true";
        }
        return false;
    });

    useEffect(() => {
        const checkGamepads = () => {
            const gamepads = navigator.getGamepads();
            const active = !!Array.from(gamepads).find(gp => gp !== null);
            setIsGamepadConnected(active);
        };

        checkGamepads();

        const handleConnect = () => setIsGamepadConnected(true);
        const handleDisconnect = () => {
            const gamepads = navigator.getGamepads();
            const active = !!Array.from(gamepads).find(gp => gp !== null);
            setIsGamepadConnected(active);
        };

        window.addEventListener("gamepadconnected", handleConnect);
        window.addEventListener("gamepaddisconnected", handleDisconnect);

        // Periodically check because some browers don't fire events consistently for built-in pads
        const interval = setInterval(checkGamepads, 2000);

        return () => {
            window.removeEventListener("gamepadconnected", handleConnect);
            window.removeEventListener("gamepaddisconnected", handleDisconnect);
            clearInterval(interval);
        };
    }, []);

    const toggleTestingMode = () => {
        const newVal = !testingMode;
        setTestingMode(newVal);
        if (typeof window !== "undefined") {
            localStorage.setItem("console_corner_testing", String(newVal));
        }
    };

    return {
        hasGamepadAccess: isGamepadConnected || testingMode,
        isGamepadConnected,
        testingMode,
        toggleTestingMode
    };
}
