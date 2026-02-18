
"use client";

import { useEffect, useState } from "react";
import { getAllClubs, requestJoin, getActiveSessions } from "@/lib/firestore-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PremiumLogo } from "@/components/PremiumLogo";
import { Users, Search, PlusCircle, ArrowUpDown, ChevronRight, Loader2, Sparkles, Trophy, Gamepad2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import Image from "next/image";
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
            {/* Hero / Create Club Section */}
            <div className="relative overflow-hidden rounded-3xl bg-surface/40 border border-white/5 p-8 md:p-12 mb-12 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start Your Legacy</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-white">
                            Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Empire</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto md:mx-0">
                            Create a club, gather your squad, and compete in weekly challenges to dominate the leaderboards.
                        </p>
                    </div>

                    <Link href="/clubs/create" className="shrink-0">
                        <Button className="h-16 px-8 text-lg font-black uppercase tracking-widest neon-border bg-black/40 hover:bg-primary hover:text-black transition-all group-hover:scale-105 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
                            <PlusCircle className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-500" />
                            Create a Club
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Find a legion to join..."
                        className="pl-12 bg-surface/50 border-white/10 h-12 text-sm md:text-base focus:border-primary/50 transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-3 gap-2 md:flex md:w-auto">
                    <Button
                        variant="outline"
                        className={`backdrop-blur-sm border-white/10 h-12 px-2 md:px-6 whitespace-nowrap text-[10px] md:text-xs ${sortBy === 'count' ? 'text-primary border-primary/30 bg-primary/5' : ''}`}
                        onClick={() => setSortBy("count")}
                    >
                        Popular
                    </Button>
                    <Button
                        variant="outline"
                        className={`backdrop-blur-sm border-white/10 h-12 px-2 md:px-6 whitespace-nowrap text-[10px] md:text-xs ${sortBy === 'newest' ? 'text-primary border-primary/30 bg-primary/5' : ''}`}
                        onClick={() => setSortBy("newest")}
                    >
                        Newest
                    </Button>
                    <Button
                        variant="outline"
                        className={`backdrop-blur-sm border-white/10 h-12 px-2 md:px-6 whitespace-nowrap text-[10px] md:text-xs ${sortBy === 'name' ? 'text-primary border-primary/30 bg-primary/5' : ''}`}
                        onClick={() => setSortBy("name")}
                    >
                        A-Z
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClubs.map((club) => (
                    <ClubCard
                        key={club.id}
                        club={club}
                        onJoin={() => handleJoinRequest(club.id)}
                    />
                ))}
            </div>

            {filteredClubs.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-bold text-white/50 italic uppercase tracking-widest">No clubs found</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">The archives are empty. Perhaps it's time to start your own?</p>
                </div>
            )}
        </main>
    );
}

function ClubCard({ club, onJoin }: { club: any, onJoin: () => void }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(false);

    useEffect(() => {
        if (isExpanded && !activeSession && !isLoadingSession) {
            const fetchSession = async () => {
                setIsLoadingSession(true);
                try {
                    const sessions = await getActiveSessions(club.id);
                    if (sessions.length > 0) {
                        setActiveSession(sessions[0]);
                    } else {
                        setActiveSession({ none: true });
                    }
                } catch (err) {
                    console.error("Failed to fetch session", err);
                } finally {
                    setIsLoadingSession(false);
                }
            };
            fetchSession();
        }
    }, [isExpanded, club.id, activeSession, isLoadingSession]);

    return (
        <Card
            className={`group flex flex-col transition-all duration-300 border-white/5 hover:border-primary/40 bg-surface/40 overflow-hidden relative cursor-pointer ${isExpanded ? 'ring-1 ring-primary/30 shadow-[0_0_20px_rgba(102,252,241,0.15)] bg-surface/60' : 'hover:scale-[1.01]'}`}
            onClick={() => setIsExpanded(!isExpanded)}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* New Tag for Newest Clubs (last 24h) */}
            {club.createdAt && (new Date().getTime() - new Date(club.createdAt).getTime() < 86400000) && (
                <div className="absolute top-0 right-0 p-2 z-10">
                    <span className="bg-primary text-black font-black text-[8px] uppercase px-2 py-1 rounded italic flex items-center gap-1">
                        <Sparkles className="w-2 h-2" /> New
                    </span>
                </div>
            )}

            {club.bannerUrl ? (
                <div className="h-20 w-full relative overflow-hidden shrink-0">
                    <Image
                        src={club.bannerUrl}
                        alt="Banner"
                        fill
                        className="object-cover opacity-40 group-hover:opacity-70 transition-opacity duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/40" />
                </div>
            ) : (
                <div className="h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 flex gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                            {club.logoUrl ? (
                                <Image
                                    src={club.logoUrl}
                                    alt={club.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Users className="w-6 h-6 text-black" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <Badge className="mb-1.5 bg-white/10 text-gray-400 border-white/10 uppercase text-[8px] tracking-widest font-bold px-2 py-0.5 rounded">
                                ID: {club.inviteCode}
                            </Badge>
                            <CardTitle className="text-xl group-hover:text-primary transition-colors truncate">{club.name}</CardTitle>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/5 text-muted-foreground text-xs font-mono shrink-0">
                        <Users className="w-3 h-3 text-primary" />
                        {club.memberCount || 0}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
                <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'mb-6' : 'mb-4'}`}>
                    <p className={`text-sm text-gray-400 transition-all duration-300 ${isExpanded ? 'line-clamp-none' : 'line-clamp-2'}`}>
                        {club.bio || "Join " + club.name + " and compete for the crown. One session per week, one winner per season."}
                    </p>

                    {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[10px] font-bold text-primary tracking-widest uppercase mb-2">Current Challenge</p>
                            {isLoadingSession ? (
                                <div className="flex items-center gap-2 py-1">
                                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground italic">Fetching intel...</span>
                                </div>
                            ) : activeSession?.none ? (
                                <p className="text-xs text-muted-foreground italic">No active challenge right now.</p>
                            ) : activeSession ? (
                                <div className="flex items-center gap-3 bg-black/40 p-2 rounded-lg border border-white/5 group/game">
                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{activeSession.gameTitle}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{activeSession.platform}</p>
                                    </div>
                                    <Gamepad2 className="w-4 h-4 text-white/10 group-hover/game:text-primary transition-colors" />
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-2">
                    {!(["Retro Legends", "Retro Racers", "RPG Realm"].includes(club.name)) && (
                        <Button
                            className="w-full neon-border font-black text-xs h-10 uppercase tracking-widest active:scale-95 transition-transform"
                            onClick={(e) => {
                                e.stopPropagation();
                                onJoin();
                            }}
                        >
                            Send Join Request
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
            {children}
        </span>
    );
}
