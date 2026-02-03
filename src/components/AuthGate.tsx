"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
} from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { LogIn, UserPlus, Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { PremiumLogo } from "@/components/PremiumLogo";
import { useAuth } from "@/context/AuthContext";

export function AuthGate() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { signUp, signIn, bypassAuth } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (mode === "login") {
                await signIn(email, password);
            } else {
                await signUp(email, password, displayName);
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto animate-fade-in-up stagger-1">
            <div className="flex flex-col items-center mb-8">
                <PremiumLogo />
                <div className="mt-2 text-center">
                    <p className="text-muted-foreground">
                        Join the elite gaming community. <br />
                        One week. One challenge. One champion.
                    </p>
                    <button
                        onClick={bypassAuth}
                        className="opacity-0 hover:opacity-100 text-[10px] text-red-500 font-mono mt-4 border border-red-500/20 px-2 py-1 rounded cursor-pointer transition-opacity"
                    >
                        [DEV: BYPASS AUTH]
                    </button>
                </div>
            </div>

            <div className="rgb-neon-border">
                <Card className="border-none bg-surface/40 backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <div className="flex bg-background/50 p-1 rounded-lg border border-white/5 mb-6">
                            <button
                                onClick={() => setMode("login")}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "login"
                                    ? "bg-primary text-black shadow-lg"
                                    : "text-muted-foreground hover:text-white"
                                    }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setMode("register")}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "register"
                                    ? "bg-primary text-black shadow-lg"
                                    : "text-muted-foreground hover:text-white"
                                    }`}
                            >
                                Register
                            </button>
                        </div>
                        <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">
                            {mode === "login" ? "Welcome Back" : "Deploy New Account"}
                        </CardTitle>
                        <CardDescription>
                            {mode === "login"
                                ? "Enter your credentials to re-enter the arena."
                                : "Create your profile to start competing."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === "register" && (
                                <div className="space-y-1">
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                                        <Input
                                            type="text"
                                            placeholder="Gamer Tag"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="pl-10 bg-background/50 border-white/10"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                                    <Input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-background/50 border-white/10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 bg-background/50 border-white/10"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-400 text-xs text-center border border-red-400/20 bg-red-400/5 p-2 rounded">
                                    {error}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-primary text-black font-black hover:bg-primary-dim transition-all group h-12"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        {mode === "login" ? "Initiate Login" : "Complete Registration"}
                                        {mode === "login" ? <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> : <UserPlus className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
