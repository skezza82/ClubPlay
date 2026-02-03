"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    getClub,
    getClubMembers,
    getActiveSession,
    getSessionScores,
    getSeasonStandings,
    leaveClub,
    submitScore,
    requestJoin,
    checkPendingRequest
} from "@/lib/firestore-service";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Gamepad2, Trophy, Users, Calendar, Crown, Shield, LogOut, Loader2, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ClubPage() {
    const { id: clubId } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [club, setClub] = useState<any>(null);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [game, setGame] = useState<any>(null);
    const [weekScores, setWeekScores] = useState<any[]>([]);
    const [seasonStandings, setSeasonStandings] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"overview" | "season" | "members">("overview");
    const [scoreInput, setScoreInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    const currentUserMembership = members.find(m => m.userId === user?.uid);
    const isOwner = currentUserMembership?.role === 'owner';
    const isAdmin = currentUserMembership?.role === 'admin' || isOwner;
    const isMember = !!currentUserMembership;

    const formatScore = (val: number, type: 'score' | 'speed') => {
        if (type === 'score' || !type) return val.toLocaleString();

        // Format seconds to MM:SS
        const minutes = Math.floor(val / 60);
        const seconds = val % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (user && clubId) {
            checkPendingRequest(user.uid, clubId as string).then(setIsPending);
        }
    }, [user, clubId]);

    const handleJoinRequest = async () => {
        if (!user || !clubId) return;
        setIsRequesting(true);
        try {
            await requestJoin(
                clubId as string,
                user.uid,
                user.displayName || "Unknown User",
                user.photoURL || undefined
            );
            setIsPending(true);
            alert("Join request sent! Waiting for admin approval. 🕒");
        } catch (error) {
            console.error("Error requesting to join:", error);
            alert("Failed to send join request.");
        } finally {
            setIsRequesting(false);
        }
    };

    const handleScoreSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activeSession || !scoreInput) return;

        const score = parseInt(scoreInput);
        if (isNaN(score) || score <= 0) {
            alert("Please enter a valid positive number.");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitScore(
                activeSession.id,
                user.uid,
                score,
                user.displayName || "Unknown Member"
            );

            setScoreInput(""); // Clear input

            // Refresh scores immediately
            const updatedScores = await getSessionScores(activeSession.id);
            const sortedScores = [...updatedScores].sort((a, b) => {
                if (activeSession.challengeType === 'speed') {
                    return a.scoreValue - b.scoreValue;
                }
                return b.scoreValue - a.scoreValue;
            });
            setWeekScores(sortedScores);

            alert("Score submitted successfully! 🔥");
        } catch (error) {
            console.error("Error submitting score:", error);
            alert("Failed to submit score.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm("Are you sure you want to leave this club?")) return;

        try {
            await leaveClub(user!.uid, clubId as string);
            alert("You have left the club.");
            router.push("/profile");
        } catch (error) {
            console.error("Error leaving club:", error);
            alert("Error: " + (error as any).message);
        }
    };

    useEffect(() => {
        if (!clubId) return;
        const fetchClubData = async () => {
            try {
                // 1. Club Details
                const clubData = await getClub(clubId as string);
                setClub(clubData);

                // 2. Members (for count and roster)
                const membersData = await getClubMembers(clubId as string);
                setMembers(membersData);

                // 3. Active Session
                const session = await getActiveSession(clubId as string);
                setActiveSession(session);

                if (session) {
                    if (session.gameId) {
                        // 4. Fetch Game Details from Supabase
                        const { data: gameData } = await supabase.from('games').select('*').eq('id', session.gameId).single();
                        if (gameData) setGame(gameData);
                    } else {
                        // It's a manual game, use session details
                        setGame({
                            title: session.gameTitle,
                            platform: session.platform,
                            cover_image_url: null
                        });
                    }

                    // 5. Week Scores
                    const scores = await getSessionScores(session.id);
                    const sortedScores = [...scores].sort((a, b) => {
                        if (session.challengeType === 'speed') {
                            return a.scoreValue - b.scoreValue; // Fastest (lowest) first
                        }
                        return b.scoreValue - a.scoreValue; // Highest first
                    });
                    setWeekScores(sortedScores);
                }

                // 6. Season Standings
                const standings = await getSeasonStandings(clubId as string);
                setSeasonStandings(standings);

            } catch (e) {
                console.error("Failed to load club data:", e);
            }
        };

        fetchClubData();
    }, [clubId]);

    if (!club) return <div className="text-white text-center py-20">Loading Club...</div>;

    return (
        <main className="min-h-screen pb-20">
            {/* Header / Hero */}
            <div className="relative bg-surface border-b border-white/10 pb-12 pt-24 px-4 overflow-hidden min-h-[300px] flex items-end">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/retro-club-bg.png"
                        alt="Background"
                        fill
                        className="object-cover opacity-30 grayscale-[0.5] contrast-125"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>
                <div className="container mx-auto max-w-5xl relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
                        {club.logoUrl ? (
                            <Image src={club.logoUrl} alt={club.name} width={128} height={128} className="object-cover w-full h-full" />
                        ) : (
                            <Shield className="w-12 h-12 text-gray-600" />
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-2">{club.name}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground text-sm font-bold tracking-widest uppercase">
                            <span className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" /> {members.length} Members</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-primary" />
                                EST. {club.createdAt ? new Date(club.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2024'}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin ? (
                            <Link href={`/clubs/${clubId}/admin`}>
                                <Button variant="ghost" className="border border-white/10 text-white hover:bg-white/10">Admin Dashboard</Button>
                            </Link>
                        ) : isMember ? (
                            <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={handleLeave}>
                                <LogOut className="w-4 h-4 mr-2" /> Leave Club
                            </Button>
                        ) : (
                            <Button
                                className="neon-border"
                                onClick={handleJoinRequest}
                                disabled={isPending || isRequesting}
                            >
                                {isRequesting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isPending ? (
                                    <span className="flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Request Sent
                                    </span>
                                ) : (
                                    "Request to Join"
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="container mx-auto max-w-5xl px-4 mt-8 mb-8">
                <div className="flex gap-2 border-b border-white/10 pb-1">
                    <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overview</TabButton>
                    <TabButton active={activeTab === "season"} onClick={() => setActiveTab("season")}>Season Leaderboard</TabButton>
                    <TabButton active={activeTab === "members"} onClick={() => setActiveTab("members")}>Members</TabButton>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto max-w-5xl px-4 space-y-8 animate-fade-in-up">

                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Main Column: Current Game & Scoreboard */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Active Game Card */}
                            <Card className="border-primary/30 bg-surface/50 backdrop-blur-md overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardHeader>
                                    <CardDescription className="text-primary font-bold tracking-widest uppercase text-xs">Current Challenge</CardDescription>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-3xl md:text-4xl font-black text-white italic">{game?.title || "No Active Game"}</CardTitle>
                                        <Gamepad2 className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="aspect-video bg-black/50 rounded-lg mb-4 border border-white/10 flex items-center justify-center text-muted-foreground relative overflow-hidden">
                                        {game?.cover_image_url ? (
                                            <Image
                                                src={game.cover_image_url}
                                                alt={game.title}
                                                fill
                                                className="object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            "Game Banner / Stream Placeholder"
                                        )}
                                    </div>
                                    <p className="text-gray-300 mb-6 font-medium italic">
                                        {activeSession?.challengeType === 'speed'
                                            ? "Speed Trial: Submit your fastest time. Record setting runs required!"
                                            : "High Score: Submit your best points total. Top the charts!"}
                                    </p>

                                    {activeSession?.rules && (
                                        <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
                                            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                                <Shield className="w-3 h-3" /> Challenge Rules
                                            </h4>
                                            <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                                                {activeSession.rules}
                                            </p>
                                            {game?.platform && (
                                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                                    <span>System:</span>
                                                    <span className="text-white">{game.platform}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isMember && activeSession ? (
                                        <form onSubmit={handleScoreSubmit} className="space-y-4 pt-4 border-t border-white/10">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                                    {activeSession?.challengeType === 'speed' ? "Your Time (Total Seconds)" : "Enter Your Score"}
                                                </label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        placeholder={activeSession?.challengeType === 'speed' ? "e.g., 90 for 01:30" : "000,000"}
                                                        value={scoreInput}
                                                        onChange={(e) => setScoreInput(e.target.value)}
                                                        className="bg-black/50 border-white/10 text-white font-mono text-xl h-14"
                                                        required
                                                    />
                                                    <Button
                                                        disabled={isSubmitting}
                                                        type="submit"
                                                        className="h-14 px-8 neon-border transition-all active:scale-95"
                                                    >
                                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "SUBMIT"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </form>
                                    ) : !isMember ? (
                                        <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Join this club to submit scores</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-muted-foreground italic">No active challenge right now.</div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Weekly Scoreboard */}
                            <Card className="border-white/5 bg-surface/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                        Weekly Leaderboard
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {weekScores.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground italic">No scores submitted yet this week. Be the first!</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {weekScores.map((score, index) => (
                                                <div key={score.id} className={`flex items-center p-3 rounded-lg border ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/5'}`}>
                                                    <div className={`w-8 h-8 flex items-center justify-center font-black text-lg mr-4 ${index === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                                        #{index + 1}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-gray-700 mr-3 overflow-hidden">
                                                        {score.photoURL && <img src={score.photoURL} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-white">{score.displayName}</div>
                                                    </div>
                                                    <div className="font-mono font-bold text-primary text-xl">
                                                        {formatScore(score.scoreValue, activeSession?.challengeType)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar: Mini Season Standings */}
                        <div className="space-y-6">
                            <Card className="border-white/5 bg-gradient-to-b from-surface to-black">
                                <CardHeader>
                                    <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Season Top 5</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {seasonStandings.slice(0, 5).map((player, i) => (
                                        <div key={player.id} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${i === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{i + 1}.</span>
                                                <span className="text-white">{player.displayName}</span>
                                            </div>
                                            <span className="font-mono text-primary">{player.points} pts</span>
                                        </div>
                                    ))}
                                    {(seasonStandings.length === 0) && <div className="text-xs text-muted-foreground">No season data yet.</div>}
                                </CardContent>
                            </Card>

                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                                <p className="font-bold mb-1 flex items-center gap-2"><Crown className="w-3 h-3" /> How to win points?</p>
                                Finish in the top rank at the end of the week (Sunday Midnight) to earn <span className="text-white font-bold">25 Season Points</span>.
                            </div>
                        </div>
                    </div>
                )}

                {/* SEASON TAB */}
                {activeTab === "season" && (
                    <Card className="border-white/10 bg-surface/40">
                        <CardHeader>
                            <CardTitle>Full Season Standings</CardTitle>
                            <CardDescription>Accumulated points from weekly victories.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg overflow-hidden border border-white/5">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-muted-foreground uppercase tracking-wider font-bold">
                                        <tr>
                                            <th className="p-4">Rank</th>
                                            <th className="p-4">Player</th>
                                            <th className="p-4 text-right">Weekly Wins</th>
                                            <th className="p-4 text-right">Total Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {seasonStandings.map((player, index) => (
                                            <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-bold text-gray-500">#{index + 1}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs">
                                                            {player.photoURL ? <img src={player.photoURL} className="w-full h-full rounded-full" /> : player.displayName[0]}
                                                        </div>
                                                        <span className="font-bold text-white">{player.displayName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right text-gray-400">{player.wins || 0}</td>
                                                <td className="p-4 text-right font-mono text-primary font-bold text-lg">{player.points}</td>
                                            </tr>
                                        ))}
                                        {(seasonStandings.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-muted-foreground">Season has just begun. No points awarded yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* MEMBERS TAB */}
                {activeTab === "members" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center p-4 rounded-xl bg-surface/50 border border-white/5 hover:border-white/20 transition-all">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mr-4 border border-white/10">
                                    {member.photoURL ? (
                                        <img src={member.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-white">{member.displayName?.[0]}</span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{member.displayName}</h4>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                                        {member.role === 'owner' && <span className="text-yellow-500 font-bold bg-yellow-500/10 px-2 rounded-full text-[10px]">OWNER</span>}
                                        {member.role === 'admin' && <span className="text-primary font-bold bg-primary/10 px-2 rounded-full text-[10px]">ADMIN</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}
        >
            {children}
        </button>
    );
}
