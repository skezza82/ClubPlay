
"use client";

import { useEffect, useState } from "react";
import { getAllClubs, requestJoin } from "@/lib/firestore-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PremiumLogo } from "@/components/PremiumLogo";
import { Users, Search, PlusCircle, ArrowUpDown, ChevronRight, Loader2, Sparkles, Trophy } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ClubsPage() {
    const [clubs, setClubs] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "name" | "count">("newest");
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const data = await getAllClubs();
                setClubs(data);
            } catch (error) {
                console.error("Error fetching clubs:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClubs();
    }, []);

    const filteredClubs = clubs
        .filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.inviteCode?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "count") return (b.memberCount || 0) - (a.memberCount || 0);
            if (sortBy === "name") return a.name.localeCompare(b.name);
            // Default newest - uses createdAt or fallback to ID
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

    const handleJoinRequest = async (clubId: string) => {
        if (!user) {
            alert("Please sign in to join a club!");
            return;
        }

        try {
            await requestJoin(
                clubId,
                user.uid,
                user.displayName || "Gamer",
                user.photoURL || undefined
            );
            alert("Join request sent! 🔥");
        } catch (error) {
            console.error("Error sending request:", error);
            alert("Failed to send request.");
        }
    };

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </main>
        );
    }

    return (
        <main className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="flex flex-col gap-2">
                    <PremiumLogo />
                    <p className="text-muted-foreground ml-1">Find your next gaming community</p>
                </div>

                <Link href="/clubs/create">
                    <Button variant="default" className="neon-border group font-bold px-8">
                        <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                        Create New Club
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or invite code (e.g. NEON)..."
                        className="pl-12 bg-surface/50 border-white/10 h-12"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className={`backdrop-blur-sm border-white/10 h-12 px-6 ${sortBy === 'count' ? 'text-primary border-primary/30 bg-primary/5' : ''}`}
                        onClick={() => setSortBy("count")}
                    >
                        Popular
                    </Button>
                    <Button
                        variant="outline"
                        className={`backdrop-blur-sm border-white/10 h-12 px-6 ${sortBy === 'newest' ? 'text-primary border-primary/30 bg-primary/5' : ''}`}
                        onClick={() => setSortBy("newest")}
                    >
                        Newest
                    </Button>
                    <Button
                        variant="outline"
                        className={`backdrop-blur-sm border-white/10 h-12 px-6 ${sortBy === 'name' ? 'text-primary border-primary/30 bg-primary/5' : ''}`}
                        onClick={() => setSortBy("name")}
                    >
                        A-Z
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClubs.map((club) => (
                    <Card key={club.id} className="group hover:scale-[1.02] transition-all duration-300 border-white/5 hover:border-primary/40 bg-surface/40 overflow-hidden relative">
                        {/* New Tag for Newest Clubs (last 24h) */}
                        {club.createdAt && (new Date().getTime() - new Date(club.createdAt).getTime() < 86400000) && (
                            <div className="absolute top-0 right-0 p-2 z-10">
                                <span className="bg-primary text-black font-black text-[8px] uppercase px-2 py-1 rounded italic flex items-center gap-1">
                                    <Sparkles className="w-2 h-2" /> New
                                </span>
                            </div>
                        )}

                        <div className="h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="mb-2 bg-white/10 text-gray-400 border-white/10 uppercase text-[10px] tracking-widest font-bold px-2 py-0.5 rounded">
                                        ID: {club.inviteCode}
                                    </Badge>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{club.name}</CardTitle>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/5 text-muted-foreground text-xs font-mono">
                                    <Users className="w-3 h-3 text-primary" />
                                    {club.memberCount || 0}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="mb-6 line-clamp-2 text-gray-400">
                                {club.bio || "Join " + club.name + " and compete for the crown. One session per week, one winner per season."}
                            </CardDescription>

                            <Button
                                className="w-full neon-border font-black text-xs h-10 uppercase tracking-widest active:scale-95 transition-transform"
                                onClick={() => handleJoinRequest(club.id)}
                            >
                                Send Join Request
                                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredClubs.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <Users className="w-16 h-16 mx-auto mb-4 text-white/5" />
                    <h3 className="text-xl font-bold text-white/50 italic">No clubs found matching your search.</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Try a different keyword or start your own gaming legacy right now!</p>
                </div>
            )}
        </main>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
            {children}
        </span>
    );
}
