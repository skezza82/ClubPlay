
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PremiumLogo } from "@/components/PremiumLogo";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Shield, Camera, ArrowLeft, CheckCircle, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const { user } = useAuth();
    const [nickname, setNickname] = useState(user?.user_metadata?.username || "");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate save
        await new Promise(r => setTimeout(r, 1000));
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
                <Link href="/register">
                    <Button>Sign In</Button>
                </Link>
            </div>
        );
    }

    return (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
            <Link href="/" className="flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3 space-y-6">
                    <Card className="border-primary/20 bg-surface/40 backdrop-blur-md overflow-hidden">
                        <div className="aspect-square relative group cursor-pointer">
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <Camera className="w-12 h-12 text-white" />
                            </div>
                            <img
                                src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                alt="Profile Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">{nickname || "Adventurer"}</CardTitle>
                            <CardDescription className="flex items-center justify-center gap-1">
                                <Shield className="w-3 h-3 text-primary" />
                                Member since Jan 2026
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <span className="text-green-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                Online
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Clubs Joined</span>
                            <span className="text-white font-mono">3</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Score</span>
                            <span className="text-primary font-mono">15,400</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-6 w-full">
                    <Card className="border-white/5 bg-surface/40 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter">
                                Account <span className="text-primary">Settings</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                                        <User className="w-4 h-4" /> Nickname
                                    </label>
                                    <Input
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder="Enter your gaming handle"
                                        className="bg-background/30 border-white/10"
                                    />
                                </div>

                                <div className="space-y-2 opacity-70">
                                    <label className="text-sm font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> Email Address
                                    </label>
                                    <Input
                                        value={user.email}
                                        readOnly
                                        className="bg-background/10 border-white/5 cursor-not-allowed text-muted-foreground"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Email is managed via identity provider.</p>
                                </div>

                                <Button className="w-full neon-border font-black text-lg h-12" disabled={isSaving}>
                                    {isSaving ? "Saving..." : saved ? (
                                        <span className="flex items-center gap-2 text-green-400">
                                            <CheckCircle className="w-5 h-5" /> Changes Saved
                                        </span>
                                    ) : "Update Profile"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-white/5 bg-surface/40 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter">
                                Club <span className="text-primary">Administration</span>
                            </CardTitle>
                            <CardDescription>Manage the communities you lead.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-white/5 hover:border-primary/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            PX
                                        </div>
                                        <div>
                                            <p className="font-bold text-white group-hover:text-primary transition-colors">The Porckchop Xpress</p>
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest">Owner</p>
                                        </div>
                                    </div>
                                    <Link href="/clubs/club-0/admin">
                                        <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            Manage
                                        </Button>
                                    </Link>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-white/5 hover:border-primary/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/50 font-bold">
                                            WW
                                        </div>
                                        <div>
                                            <p className="font-bold text-white group-hover:text-primary transition-colors">Weekend Warriors</p>
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest">Admin</p>
                                        </div>
                                    </div>
                                    <Link href="/clubs/club-1/admin">
                                        <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            Manage
                                        </Button>
                                    </Link>
                                </div>

                                <Link href="/clubs/create" className="block mt-4">
                                    <Button variant="ghost" className="w-full border border-dashed border-white/10 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-primary">
                                        <PlusCircle className="w-4 h-4 mr-2" /> Start a New Club
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-500/10 bg-red-500/5">
                        <CardHeader>
                            <CardTitle className="text-red-400 text-lg uppercase tracking-widest font-bold">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="ghost" className="text-red-500 hover:bg-red-500/10 w-full justify-start">
                                Delete Account
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
