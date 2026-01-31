
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "lucide-react";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate network delay for effect
        await new Promise(r => setTimeout(r, 1500));
        await signUp(email, password, username);
        setIsLoading(false);
    };

    return (
        <main className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
            <Card className="w-full max-w-md border-primary/20 shadow-2xl shadow-primary/10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                        Create an Account
                    </CardTitle>
                    <CardDescription>
                        Join the ClubPlay league today.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Username
                            </label>
                            <Input
                                placeholder="skezz_gamer"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Email
                            </label>
                            <Input
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Password
                            </label>
                            <Input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button className="w-full font-bold text-lg" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground mt-4">
                            Already have an account? <Link href="#" className="underline text-primary hover:text-primary/80">Login</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
