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

export function AuthGate({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
    const [mode, setMode] = useState<"login" | "register">(initialMode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { signUp, signIn, bypassAuth, loginWithGoogle } = useAuth();
    // Add router
    const { useRouter } = require("next/navigation");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (mode === "login") {
                await signIn(email, password);
            } else {
                await signUp(email, password, displayName);
                // Redirect to profile to set avatar
                router.push("/profile");
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
                                className="w-full bg-primary text-white font-black hover:bg-primary-dim transition-all group h-12"
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

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/5"></span>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                                    <span className="bg-[#0B0C10] px-2 text-muted-foreground">Or Connect Via</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all h-12 font-bold flex items-center justify-center gap-2"
                                    onClick={() => {
                                        setLoading(true);
                                        loginWithGoogle().finally(() => setLoading(false));
                                    }}
                                    disabled={loading}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Continue with Google
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
