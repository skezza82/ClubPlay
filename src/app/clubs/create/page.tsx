
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PremiumLogo } from "@/components/PremiumLogo";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateClubPage() {
    const [name, setName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("Please sign in to create a club!");
            return;
        }

        setIsLoading(true);
        // Simulate network delay
        await new Promise(r => setTimeout(r, 1000));

        const { data, error } = await supabase.from('clubs').insert({
            name,
            invite_code: inviteCode.toUpperCase(),
            owner_id: user.id,
            member_count: 1,
            created_at: new Date().toISOString()
        });

        if (!error) {
            // Also join the club as owner
            await supabase.from('club_members').insert({
                club_id: (data as any)[0].id,
                user_id: user.id,
                role: 'owner'
            });

            alert("Club created successfully!");
            router.push("/clubs");
        } else {
            alert("Error creating club: " + error.message);
        }
        setIsLoading(false);
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-2xl min-h-[calc(100vh-80px)] flex flex-col justify-center">
            <Link href="/clubs" className="flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Discovery
            </Link>

            <div className="mb-12 text-center animate-float">
                <PremiumLogo />
                <h2 className="text-3xl font-black text-white mt-4 uppercase tracking-tighter">Start Your Legacy</h2>
            </div>

            <Card className="border-primary/20 shadow-2xl shadow-primary/5 bg-surface/40 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle>Club Registration</CardTitle>
                    <CardDescription>Establish your community and compete in the weekly arena.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary tracking-widest uppercase">Club Name</label>
                            <Input
                                placeholder="e.g. The Neon Knights"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-background/30 border-white/10 focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary tracking-widest uppercase">Unique Invite Code</label>
                            <Input
                                placeholder="e.g. NEON"
                                required
                                maxLength={4}
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                className="bg-background/30 border-white/10 focus:border-primary/50 font-mono"
                            />
                            <p className="text-[10px] text-muted-foreground">4 characters max. This will be used for joining your club.</p>
                        </div>

                        <Button className="w-full neon-border font-black text-lg h-14" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                "CREATE CLUB"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
