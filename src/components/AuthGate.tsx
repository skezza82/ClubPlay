// ... imports
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { LogIn, UserPlus, Loader2, Mail, Lock, User as UserIcon, ArrowLeft, Send } from "lucide-react";
import { PremiumLogo } from "@/components/PremiumLogo";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function AuthGate({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
    const [mode, setMode] = useState<"login" | "register" | "reset">(initialMode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const { signUp, signIn, bypassAuth } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            if (mode === "login") {
                await signIn(email, password);
            } else if (mode === "register") {
                await signUp(email, password, displayName);
                // Redirect to profile to set avatar
                router.push("/profile");
            } else if (mode === "reset") {
                await sendPasswordResetEmail(auth, resetEmail);
                setSuccessMessage("Password reset email sent! Check your inbox.");
                setResetEmail("");
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
                        {mode !== "reset" ? (
                            <div className="flex bg-background/50 p-1 rounded-lg border border-white/5 mb-6">
                                <button
                                    type="button"
                                    onClick={() => { setMode("login"); setError(""); setSuccessMessage(""); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "login"
                                        ? "bg-primary text-black shadow-lg"
                                        : "text-muted-foreground hover:text-white"
                                        }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMode("register"); setError(""); setSuccessMessage(""); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "register"
                                        ? "bg-primary text-black shadow-lg"
                                        : "text-muted-foreground hover:text-white"
                                        }`}
                                >
                                    Register
                                </button>
                            </div>
                        ) : (
                            <div className="mb-6 flex justify-start">
                                <button
                                    type="button"
                                    onClick={() => { setMode("login"); setError(""); setSuccessMessage(""); }}
                                    className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                                </button>
                            </div>
                        )}

                        <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">
                            {mode === "login" && "Welcome Back"}
                            {mode === "register" && "Deploy New Account"}
                            {mode === "reset" && "Account Recovery"}
                        </CardTitle>
                        <CardDescription>
                            {mode === "login" && "Enter your credentials to re-enter the arena."}
                            {mode === "register" && "Create your profile to start competing."}
                            {mode === "reset" && "Enter your email to receive a password reset link."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === "reset" ? (
                                <div className="space-y-1">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                                        <Input
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="pl-10 bg-background/50 border-white/10"
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
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
                                        {mode === "login" && (
                                            <div className="flex justify-end pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => { setMode("reset"); setError(""); setSuccessMessage(""); }}
                                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    Forgot Password?
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {error && (
                                <p className="text-red-400 text-xs text-center border border-red-400/20 bg-red-400/5 p-2 rounded animate-shake">
                                    {error}
                                </p>
                            )}

                            {successMessage && (
                                <p className="text-green-400 text-xs text-center border border-green-400/20 bg-green-400/5 p-2 rounded animate-fade-in">
                                    {successMessage}
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
                                        {mode === "login" && (
                                            <>
                                                Initiate Login <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                        {mode === "register" && (
                                            <>
                                                Complete Registration <UserPlus className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                        {mode === "reset" && (
                                            <>
                                                Send Reset Link <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
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
