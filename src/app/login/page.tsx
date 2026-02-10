"use client";

import { AuthGate } from "@/components/AuthGate";

export default function Login() {
    return (
        <main className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-80px)] relative overflow-hidden">
            <AuthGate />
        </main>
    );
}

