"use client";

import { AuthGate } from "@/components/AuthGate";

export default function Register() {
    return (
        <main className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-80px)] relative overflow-hidden">
            {/* Note: AuthGate handles its own mode switching, 
                but we can't easily force it to start in 'register' without props.
                However, AuthGate already has a toggle.
            */}
            <AuthGate initialMode="register" />
        </main>
    );
}

