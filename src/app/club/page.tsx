"use client";

import { Suspense, useEffect, useState, useRef, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    getClub,
    getClubMembers,
    getClubSessions,
    getClubSessionScores,
    joinClub,
    submitScore,
    leaveClub,
    getClubMessages,
    sendClubMessage,
    getGameOfTheMonth,
    submitGOTMReview,
    getUserGOTMReview,
    getSeasonStandings,
    deleteSession,
    sendFriendRequest,
    getSentFriendRequests,
    getFriends,
    checkPendingRequest,
    getXpLevel
} from "@/lib/firestore-service";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
    Trophy,
    Users,
    Gamepad2,
    Calendar,
    MessageSquare,
    Send,
    Loader2,
    Check,
    LogOut,
    Crown,
    Trash2,
    Shield,
    Timer,
    Edit,
    ThumbsUp,
    ThumbsDown,
    UserPlus,
    Share2,
    Info
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Share } from '@capacitor/share';

// Add the missing getLibretroBoxartUrl helper
const getLibretroBoxartUrl = (gameTitle: string, platform: string) => {
    if (!gameTitle || !platform) return "";
    const cleanTitle = gameTitle.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
    const folderMap: { [key: string]: string } = {
        'NES': 'Nintendo_-_Nintendo_Entertainment_System',
        'SNES': 'Nintendo_-_Super_Nintendo_Entertainment_System',
        'N64': 'Nintendo_-_Nintendo_64',
        'GBC': 'Nintendo_-_Game_Boy_Color',
        'GBA': 'Nintendo_-_Game_Boy_Advance',
        'Genesis': 'Sega_-_Mega_Drive_-_Genesis',
        'PS1': 'Sony_-_PlayStation'
    };
    const folder = folderMap[platform] || platform;
    return `https://thumbnails.libretro.com/${folder}/Named_Boxarts/${cleanTitle}.png`;
};

const PLACEHOLDER_BOXART_URL = "https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.png";

function CountdownTimer({ targetDate }: { targetDate: any }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft("EXPIRED");
                clearInterval(interval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <div className="font-mono text-xl font-black text-white bg-black/40 px-3 py-1 rounded inline-block">
            {timeLeft}
        </div>
    );
}

function ClubContent() {
    const searchParams = useSearchParams();
    const clubId = searchParams.get("id");
    const { user } = useAuth();
    const router = useRouter();
    const [isPendingJoin, setIsPendingJoin] = useState(false);

    const [club, setClub] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    const [pastSessions, setPastSessions] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [weekScores, setWeekScores] = useState<any[]>([]);
    const [seasonStandings, setSeasonStandings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scoreInput, setScoreInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    // Chat functionality
    const [messages, setMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // GOTM functionality
    const [gotm, setGotm] = useState<any>(null);
    const [userReview, setUserReview] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        ratings: { graphics: 5, sound: 5, gameplay: 5, story: 5, replayability: 5 },
        recommend: true,
        completed: false,
        text: ""
    });

    const [isRequesting, setIsRequesting] = useState(false);
    const [sentRequests, setSentRequests] = useState<string[]>([]);
    const [friendsList, setFriendsList] = useState<string[]>([]);

    useEffect(() => {
        if (!clubId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const clubData = await getClub(clubId);
                setClub(clubData);

                const membersData = await getClubMembers(clubId);
                setMembers(membersData);

                const sessions = await getClubSessions(clubId);
                const now = new Date();
                const active = sessions.filter(s => new Date(s.endDate) > now);
                const past = sessions.filter(s => new Date(s.endDate) <= now).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

                setActiveSessions(active);
                setPastSessions(past);
                if (active.length > 0) {
                    setSelectedSession(active[0]);
                } else if (past.length > 0) {
                    // Fallback to most recent past session for display
                    setSelectedSession(past[0]);
                }

                const standings = await getSeasonStandings(clubId);
                setSeasonStandings(standings);

                const gotmData = await getGameOfTheMonth(clubId);
                setGotm(gotmData);

                if (user && gotmData) {
                    const review = await getUserGOTMReview(gotmData.id, user.uid);
                    setUserReview(review);
                }

                if (user) {
                    const pending = await checkPendingRequest(user.uid, clubId);
                    setIsPendingJoin(pending);

                    const sent = await getSentFriendRequests(user.uid);
                    setSentRequests(sent);
                    const friends = await getFriends(user.uid);
                    setFriendsList(friends.map(f => f.uid));
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching club data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [clubId, user]);

    useEffect(() => {
        if (selectedSession) {
            getClubSessionScores(selectedSession.id).then(scores => {
                const sorted = [...scores].sort((a, b) => {
                    if (selectedSession.challengeType === 'speed') {
                        return a.scoreValue - b.scoreValue;
                    }
                    return b.scoreValue - a.scoreValue;
                });
                setWeekScores(sorted);
            });
        }
    }, [selectedSession, clubId]);

    useEffect(() => {
        if (clubId && activeTab === "overview") {
            const unsubscribe = getClubMessages(clubId, (newMessages) => {
                setMessages(newMessages);
            });
            return () => unsubscribe();
        }
    }, [clubId, activeTab]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const isMember = user && members.some(m => m.userId === user.uid);
    const isAdmin = user && members.some(m => m.userId === user.uid && (m.role === 'admin' || m.role === 'owner'));
    const isPending = isPendingJoin;

    const isSessionActive = selectedSession && new Date(selectedSession.endDate) > new Date();

    const handleJoinRequest = async () => {
        if (!user || !clubId) return;
        setIsRequesting(true);
        try {
            await joinClub(clubId, user.uid, user.displayName || "Unknown User", user.photoURL || "");
            setIsPendingJoin(true);
        } catch (error) {
            console.error(error);
            alert("Failed to send request");
        } finally {
            setIsRequesting(false);
        }
    };

    const handleScoreSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !selectedSession || !scoreInput) return;

        setIsSubmitting(true);
        try {
            await submitScore(selectedSession.id, user.uid, parseInt(scoreInput), user.displayName || "Unknown User");
            const updatedScores = await getClubSessionScores(selectedSession.id);
            const sorted = [...updatedScores].sort((a, b) => {
                if (selectedSession.challengeType === 'speed') {
                    return a.scoreValue - b.scoreValue;
                }
                return b.scoreValue - a.scoreValue;
            });
            setWeekScores(sorted);
            setScoreInput("");
            alert("Score submitted successfully! 🎮");
        } catch (error) {
            console.error(error);
            alert("Failed to submit score");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !chatInput.trim() || isSending) return;

        setIsSending(true);
        try {
            await sendClubMessage(clubId!, user.uid, chatInput.trim(), {
                displayName: user.displayName || "Unknown",
                photoURL: user.photoURL || undefined
            });
            setChatInput("");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    const handleLeave = async () => {
        if (!user || !window.confirm("Are you sure you want to leave this club?")) return;
        try {
            await leaveClub(user.uid, clubId!);
            router.push('/');
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!window.confirm("Delete this session and all its scores?")) return;
        try {
            await deleteSession(sessionId);
            setPastSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (error) {
            console.error(error);
        }
    };

    const formatScore = (val: number, type: string) => {
        if (type === 'speed') {
            const mins = Math.floor(val / 60);
            const secs = val % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        return val.toLocaleString();
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!club) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
            <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Club Not Found</h1>
            <Button onClick={() => router.push('/')}>Return Home</Button>
        </div>
    );

    const game = selectedSession ? {
        title: selectedSession.gameTitle,
        platform: selectedSession.platform,
        cover_image_url: selectedSession.cover_image_url || null
    } : null;

    return (
        <main className="min-h-screen bg-background pb-20">
            {/* Hero / Header Section */}
            <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
                    <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10" />
                    {club.bannerUrl ? (
                        <Image
                            src={club.bannerUrl}
                            alt={club.name}
                            fill
                            className="object-cover scale-100"
                        />
                    ) : (
                        <div className="w-full h-full bg-surface" />
                    )}
                </div>

                <div className="relative z-20 h-full container mx-auto max-w-3xl px-6 flex flex-col justify-end pb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg transform rotate-3 overflow-hidden">
                            {club.logoUrl ? (
                                <Image
                                    src={club.logoUrl}
                                    alt={club.name}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Users className="w-8 h-8 text-black" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic">
                                {club.name}
                            </h1>
                            <div className="flex items-center gap-3 text-muted-foreground font-bold tracking-widest text-xs uppercase mt-1">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {members.length} Members</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span>Est. {new Date(club.createdAt).getFullYear()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {isAdmin ? (
                            <Link href={`/club/admin?id=${clubId}`}>
                                <Button variant="ghost" className="border border-white/10 text-white hover:bg-white/10">Admin Dashboard</Button>
                            </Link>
                        ) : isMember ? (
                            <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={handleLeave}>
                                <LogOut className="w-4 h-4 mr-2" /> Leave Club
                            </Button>
                        ) : (
                            !(["Retro Legends", "Retro Racers", "RPG Realm"].includes(club?.name || "")) && (
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
                            )
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 border-primary/30 text-primary hover:bg-primary/10 rounded-full"
                            onClick={async () => {
                                try {
                                    await Share.share({
                                        title: 'Join my Club on ClubPlay!',
                                        text: `Come join ${club.name} on ClubPlay! Use invite code: ${club.inviteCode}`,
                                        url: 'https://play.google.com/store/apps/details?id=com.clubplaygaming.app',
                                        dialogTitle: 'Invite Friends',
                                    });
                                } catch (error) {
                                    console.log('Error sharing:', error);
                                    alert(`Invite Code: ${club.inviteCode}`);
                                }
                            }}
                        >
                            <Share2 className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="container mx-auto max-w-3xl px-6 mt-8 mb-8">
                <div className="flex gap-2 border-b border-white/10 pb-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overview</TabButton>
                    <TabButton active={activeTab === "season"} onClick={() => setActiveTab("season")}>Club Leaderboard</TabButton>
                    <TabButton active={activeTab === "members"} onClick={() => setActiveTab("members")}>Members</TabButton>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto max-w-3xl px-6 space-y-8 animate-fade-in-up">

                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <>
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Main Column: Current Game & Scoreboard */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Session Selector (if multiple) */}
                                {activeSessions.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {activeSessions.map((session) => (
                                            <button
                                                key={session.id}
                                                onClick={() => setSelectedSession(session)}
                                                className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-bold uppercase tracking-wider transition-all
                                                ${selectedSession?.id === session.id
                                                        ? 'bg-primary text-black border-primary'
                                                        : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'}`}
                                            >
                                                {session.gameTitle}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Active Game Card */}
                                <Card className="border-primary/30 bg-surface/50 backdrop-blur-md overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader>
                                        <CardDescription className="text-primary font-bold tracking-widest uppercase text-xs">
                                            {isSessionActive ? "Current Challenge" : "Previous Challenge"}
                                        </CardDescription>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-3xl md:text-4xl font-black text-white italic">{game?.title || "No Active Game"}</CardTitle>
                                            <Gamepad2 className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="aspect-video bg-black/50 rounded-lg mb-4 border border-white/10 flex items-center justify-center text-muted-foreground relative overflow-hidden">
                                            {game?.cover_image_url || (game?.title && game?.platform) ? (
                                                <Image
                                                    src={game.cover_image_url || getLibretroBoxartUrl(game.title, game.platform)}
                                                    alt={game.title}
                                                    fill
                                                    className="object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                                    onError={(e: any) => {
                                                        e.target.srcset = PLACEHOLDER_BOXART_URL;
                                                        e.target.src = PLACEHOLDER_BOXART_URL;
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Gamepad2 className="w-8 h-8 opacity-20" />
                                                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-20">No Banner Available</span>
                                                </div>
                                            )}
                                        </div>
                                        {selectedSession && (
                                            <p className="text-gray-300 mb-6 font-medium italic">
                                                {selectedSession.challengeType === 'speed'
                                                    ? "Speed Trial: Submit your fastest time. Record setting runs required!"
                                                    : "High Score: Submit your best points total. Top the charts!"}
                                            </p>
                                        )}

                                        {selectedSession?.rules && (
                                            <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
                                                <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                                    <Shield className="w-3 h-3" /> Challenge Rules
                                                </h4>
                                                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                                                    {selectedSession.rules}
                                                </p>

                                                <div className="mt-4 pt-4 border-t border-primary/20">
                                                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                                        <Timer className="w-3 h-3" /> Time Remaining
                                                    </h4>
                                                    <CountdownTimer targetDate={selectedSession.endDate} />
                                                </div>
                                                {game?.platform && (
                                                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                                        <span>System:</span>
                                                        <span className="text-white">{game.platform}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isMember && selectedSession ? (
                                            isSessionActive ? (
                                                <form onSubmit={handleScoreSubmit} className="space-y-4 pt-4 border-t border-white/10">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                                            {selectedSession?.challengeType === 'speed' ? "Your Time (Total Seconds)" : "Enter Your Score"}
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="number"
                                                                placeholder={selectedSession?.challengeType === 'speed' ? "e.g., 90 for 01:30" : "000,000"}
                                                                value={scoreInput}
                                                                onChange={(e) => setScoreInput(e.target.value)}
                                                                className="flex-1 bg-black/50 border-white/10 text-white font-mono text-xl h-14"
                                                                required
                                                            />
                                                            <Button
                                                                disabled={isSubmitting}
                                                                type="submit"
                                                                className="h-14 px-12 rounded-full neon-border transition-all active:scale-95 font-black font-mono tracking-normal text-sm"
                                                            >
                                                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "SUBMIT"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Challenge Has Ended</p>
                                                    {/* Show Winner Here? */}
                                                    {club?.latestWinnerName && (
                                                        <p className="text-sm text-yellow-500 font-bold mt-2">
                                                            Winner: {club.latestWinnerName} 🏆
                                                        </p>
                                                    )}
                                                </div>
                                            )
                                        ) : !isMember ? (
                                            <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Join this club to submit scores</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-muted-foreground italic">No active challenge right now.</div>
                                        )}
                                    </CardContent>
                                </Card>

                                {isMember ? (
                                    <Card className="border-white/10 bg-gradient-to-b from-surface to-background overflow-hidden mb-6">
                                        <CardHeader className="bg-black/20 pb-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-bold">{weekScores.length} Submissions</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-white/5">
                                                {weekScores.slice(0, 10).map((score, i) => {
                                                    const member = members.find(m => m.userId === score.userId);
                                                    const displayName = member?.displayName || score.displayName;

                                                    return (
                                                        <div key={score.id} className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/5 ${i === 0 ? 'bg-yellow-500/5' : ''}`}>
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border
                                                                ${i === 0 ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' :
                                                                        i === 1 ? 'bg-slate-400 border-slate-300 text-black' :
                                                                            i === 2 ? 'bg-amber-700 border-amber-600 text-white' : 'bg-black/40 border-white/10 text-muted-foreground'}`}>
                                                                    {i + 1}
                                                                </div>
                                                                <UserAvatar
                                                                    photoURL={member?.photoURL || score.photoURL}
                                                                    displayName={displayName}
                                                                    xp={member?.xp || score.xp || 0}
                                                                    size="md"
                                                                    isWinner={i === 0 && weekScores.length > 0}
                                                                />
                                                                <div>
                                                                    <div className="text-sm font-black text-white">{displayName}</div>
                                                                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Level {getXpLevel(member?.xp || score.xp || 0)}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`font-mono font-black text-lg ${i === 0 ? 'text-yellow-500' : 'text-primary'}`}>
                                                                    {formatScore(score.scoreValue, selectedSession?.challengeType)}
                                                                </div>
                                                                <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                                    {score.submittedAt ? new Date(score.submittedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                {weekScores.length === 0 && (
                                                    <div className="px-6 py-12 text-center">
                                                        <Gamepad2 className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                                        <p className="text-sm text-muted-foreground italic font-medium">The arena is empty. Submit the first score!</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        {weekScores.length > 10 && (
                                            <div className="p-4 bg-black/20 text-center border-t border-white/5">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">+ {weekScores.length - 10} more players in the chase</p>
                                            </div>
                                        )}
                                    </Card>
                                ) : (
                                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center mb-6">
                                        <Trophy className="w-8 h-8 text-primary/40 mx-auto mb-3" />
                                        <h4 className="font-black text-white uppercase tracking-wider mb-2">Members Only Arena</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Join this club to see the full live leaderboard and compete for the weekly crown!
                                        </p>
                                    </div>
                                )}

                                {/* Game of the Month Box (GOTM moved from tab) */}
                                {gotm && (
                                    <div className="animate-fade-in-up">
                                        <Card className="border-primary/30 bg-surface/50 backdrop-blur-md overflow-hidden relative group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardDescription className="text-primary font-bold tracking-widest uppercase text-xs mb-1">Game of the Month</CardDescription>
                                                        <CardTitle className="text-3xl md:text-4xl font-black text-white italic lowercase">{gotm.title}</CardTitle>
                                                    </div>
                                                    <Trophy className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
                                                </div>
                                            </CardHeader>

                                            <CardContent className="relative z-10 space-y-6">
                                                <div className="flex flex-col sm:flex-row gap-6">
                                                    <div className="w-full sm:w-32 shrink-0">
                                                        <div className="aspect-[3/4] relative rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
                                                            {gotm.coverUrl ? (
                                                                <Image src={gotm.coverUrl} alt={gotm.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                                    <Gamepad2 className="w-16 h-16 text-gray-600" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-4">
                                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2">Mission Briefing</h3>
                                                        <p className="text-gray-300 leading-relaxed text-sm">
                                                            {gotm.description || "No specific briefing for this title. Explore the game and report back, soldier!"}
                                                        </p>

                                                        <div className="pt-2">
                                                            {!userReview ? (
                                                                (() => {
                                                                    const now = new Date();
                                                                    const end = new Date(gotm.endDate);
                                                                    const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                                                                    const isReviewPeriod = diffDays <= 10;

                                                                    if (!isReviewPeriod) {
                                                                        return (
                                                                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200 text-[10px]">
                                                                                <strong className="block uppercase tracking-widest mb-1 text-primary">Status: Active Mission</strong>
                                                                                Reviews will unlock during the final designated operational window (last 10 days of the month).
                                                                            </div>
                                                                        );
                                                                    }

                                                                    if (isReviewOpen) {
                                                                        return (
                                                                            <div className="bg-black/40 border border-white/10 rounded-xl p-4 animate-fade-in-up">
                                                                                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest text-center">Submit Your Report</h4>

                                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                                                                                    {(['graphics', 'sound', 'gameplay', 'story', 'replayability'] as const).map(cat => (
                                                                                        <div key={cat} className="space-y-1">
                                                                                            <div className="flex justify-between">
                                                                                                <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">{cat}</label>
                                                                                                <span className="text-[8px] font-mono font-bold text-primary">{reviewForm.ratings[cat]}/11</span>
                                                                                            </div>
                                                                                            <input
                                                                                                type="range"
                                                                                                min="0"
                                                                                                max="11"
                                                                                                value={reviewForm.ratings[cat]}
                                                                                                onChange={e => setReviewForm(prev => ({
                                                                                                    ...prev,
                                                                                                    ratings: { ...prev.ratings, [cat]: parseInt(e.target.value) }
                                                                                                }))}
                                                                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                                                                            />
                                                                                        </div>
                                                                                    ))}
                                                                                </div>

                                                                                <div className="mb-4 space-y-2">
                                                                                    <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground text-center block">Would you recommend this?</label>
                                                                                    <div className="flex gap-2 justify-center">
                                                                                        <Button
                                                                                            type="button"
                                                                                            size="sm"
                                                                                            variant={reviewForm.recommend ? "default" : "outline"}
                                                                                            onClick={() => setReviewForm(prev => ({ ...prev, recommend: true }))}
                                                                                            className={reviewForm.recommend ? "bg-green-500 hover:bg-green-600 text-white text-[10px]" : "border-white/10 text-muted-foreground text-[10px]"}
                                                                                        >
                                                                                            <ThumbsUp className="w-3 h-3 mr-1" /> YES
                                                                                        </Button>
                                                                                        <Button
                                                                                            type="button"
                                                                                            size="sm"
                                                                                            variant={!reviewForm.recommend ? "destructive" : "outline"}
                                                                                            onClick={() => setReviewForm(prev => ({ ...prev, recommend: false }))}
                                                                                            className={!reviewForm.recommend ? "text-[10px]" : "border-white/10 text-muted-foreground text-[10px]"}
                                                                                        >
                                                                                            <ThumbsDown className="w-3 h-3 mr-1" /> NO
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="mb-4">
                                                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                                                        <div
                                                                                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                                                            ${reviewForm.completed ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-primary/50'}`}
                                                                                        >
                                                                                            {reviewForm.completed && <Check className="w-3 h-3 text-black font-bold" />}
                                                                                        </div>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            className="hidden"
                                                                                            checked={reviewForm.completed}
                                                                                            onChange={(e) => setReviewForm(prev => ({ ...prev, completed: e.target.checked }))}
                                                                                        />
                                                                                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                                                                                            Completed it mate?
                                                                                        </span>
                                                                                    </label>
                                                                                </div>

                                                                                <div className="mb-4 space-y-1">
                                                                                    <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Mini Review</label>
                                                                                    <textarea
                                                                                        value={reviewForm.text}
                                                                                        onChange={e => setReviewForm(prev => ({ ...prev, text: e.target.value }))}
                                                                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-primary/50 h-16 resize-none"
                                                                                        placeholder="Share your thoughts..."
                                                                                    />
                                                                                </div>

                                                                                <div className="flex gap-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        onClick={async () => {
                                                                                            if (!reviewForm.text.trim()) return alert("Please write a short review.");
                                                                                            try {
                                                                                                setIsSubmitting(true);
                                                                                                if (user && gotm) {
                                                                                                    await submitGOTMReview(clubId as string, gotm.id, user.uid, {
                                                                                                        ...reviewForm,
                                                                                                        reviewText: reviewForm.text,
                                                                                                        displayName: user.displayName || "Unknown",
                                                                                                        photoURL: user.photoURL || undefined,
                                                                                                        completed: reviewForm.completed
                                                                                                    });
                                                                                                    alert("Review posted! 📝");
                                                                                                    const r = await getUserGOTMReview(gotm.id, user.uid);
                                                                                                    setUserReview(r);
                                                                                                    setIsReviewOpen(false);
                                                                                                }
                                                                                            } catch (e) {
                                                                                                console.error(e);
                                                                                                alert("Failed to submit review");
                                                                                            } finally {
                                                                                                setIsSubmitting(false);
                                                                                            }
                                                                                        }}
                                                                                        disabled={isSubmitting}
                                                                                        className="flex-1 font-bold uppercase tracking-widest text-[10px]"
                                                                                    >
                                                                                        {isSubmitting ? <Loader2 className="animate-spin w-3 h-3 mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                                                                                        Submit
                                                                                    </Button>
                                                                                    <Button variant="ghost" size="sm" className="text-[10px]" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    } else {
                                                                        return (
                                                                            <Button onClick={() => setIsReviewOpen(true)} className="w-full font-bold uppercase tracking-widest neon-border-static h-10 text-[10px]">
                                                                                <Edit className="w-3 h-3 mr-2" /> Write a Review
                                                                            </Button>
                                                                        );
                                                                    }
                                                                })()
                                                            ) : (
                                                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <div>
                                                                            <h4 className="text-green-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                                                                <Check className="w-3 h-3" /> Review Submitted
                                                                            </h4>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            {userReview.completed && (
                                                                                <span className="flex items-center gap-1 text-primary font-bold uppercase text-[9px] bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                                                                    <Check className="w-2 h-2" /> Completed
                                                                                </span>
                                                                            )}
                                                                            {userReview.recommend ? (
                                                                                <span className="flex items-center gap-1 text-green-400 font-bold uppercase text-[9px]">
                                                                                    <ThumbsUp className="w-2 h-2" /> Recommended
                                                                                </span>
                                                                            ) : (
                                                                                <span className="flex items-center gap-1 text-red-400 font-bold uppercase text-[9px]">
                                                                                    <ThumbsDown className="w-2 h-2" /> Not Recommended
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-5 gap-1 mb-3 text-center">
                                                                        {(['graphics', 'sound', 'gameplay', 'story', 'replayability'] as const).map(cat => (
                                                                            <div key={cat} className="bg-black/20 p-1.5 rounded">
                                                                                <div className="text-[7px] uppercase font-bold text-muted-foreground mb-0.5">{cat.slice(0, 4)}</div>
                                                                                <div className="text-[10px] font-mono font-bold text-white">{userReview.ratings[cat]}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-300 italic">"{userReview.reviewText}"</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>

                            {/* Club About Card */}
                            <Card className="border-white/10 bg-surface/40 backdrop-blur-md overflow-hidden relative group">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Info className="w-3 h-3" /> About the Club
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden border border-white/5">
                                            {club.logoUrl ? (
                                                <Image src={club.logoUrl} alt={club.name} width={40} height={40} className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-white truncate">{club.name}</h4>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter italic">ID: {club.inviteCode}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest border-y border-white/5 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3 h-3 text-primary" /> {members.length} Members
                                        </div>
                                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-primary" /> {new Date(club.createdAt).getFullYear()}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-300 leading-relaxed italic">
                                        {club.bio || "No mission statement provided. Join us and help define our legacy!"}
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Crown className="w-12 h-12 text-blue-400" />
                                </div>
                                <p className="font-black mb-3 flex items-center gap-2 uppercase tracking-widest text-blue-400 italic">
                                    <Crown className="w-4 h-4" /> How to win?
                                </p>
                                <ul className="space-y-3 relative z-10">
                                    <li className="flex gap-3">
                                        <span className="w-5 h-5 rounded-full bg-yellow-500 text-black flex items-center justify-center font-black shrink-0 text-[10px]">1</span>
                                        <span>Finish <span className="text-white font-bold">1st</span> for maximum Club Points and the Weekly Trophy.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-5 h-5 rounded-full bg-slate-400 text-black flex items-center justify-center font-black shrink-0 text-[10px]">2</span>
                                        <span>Secure <span className="text-white font-bold">2nd</span> place for a significant points boost.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center font-black shrink-0 text-[10px]">3</span>
                                        <span>Hold <span className="text-white font-bold">3rd</span> place for consistent season progression.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-5 h-5 rounded-full bg-blue-500/50 text-white flex items-center justify-center font-black shrink-0 text-[10px]">4+</span>
                                        <span>Players 4th and below score <span className="text-white font-bold">25 points</span> for participation.</span>
                                    </li>
                                </ul>
                                <div className="mt-4 pt-4 border-t border-blue-500/20 text-[10px] text-blue-300/80 font-medium italic">
                                    <p className="flex items-center gap-2">
                                        <span className="text-primary text-xs">💡</span>
                                        <span><span className="text-primary font-bold">Bonus Tip:</span> Being the first to post a score rewards <span className="text-white">Extra XP</span> towards your player level!</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chat Section in Overview */}
                        <div className="flex flex-col h-[500px] bg-surface/30 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden mt-8">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-primary" /> Club Chat
                                </h3>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> Members Only
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent scroll-smooth"
                            >
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                        <MessageSquare className="w-12 h-12 mb-2" />
                                        <p className="text-sm">No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg.id} className={`flex gap-3 ${msg.userId === user?.uid ? 'flex-row-reverse' : ''}`}>
                                            <UserAvatar
                                                photoURL={msg.photoURL}
                                                displayName={msg.displayName}
                                                xp={msg.xp || 0}
                                                size="sm"
                                                showLevel={false}
                                                isWinner={club?.latestWinnerId === msg.userId || (club?.latestWinnerName && club?.latestWinnerName === msg.displayName)}
                                            />
                                            <div className={`max-w-[80%] space-y-1 ${msg.userId === user?.uid ? 'items-end flex flex-col' : ''}`}>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                                                    <span className="font-bold text-white/80">{msg.displayName}</span>
                                                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className={`p-3 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${msg.userId === user?.uid ? 'bg-primary text-black rounded-tr-none font-medium' : 'bg-white/10 text-white rounded-tl-none border border-white/5'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-black/40 border-t border-white/10">
                                {isMember ? (
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <Input
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-white/5 border-white/10 text-white focus:ring-primary/50"
                                            disabled={isSending}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={!chatInput.trim() || isSending}
                                            className="bg-primary text-black hover:bg-primary/90 font-bold"
                                        >
                                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="text-center text-xs text-muted-foreground py-2 italic border border-dashed border-white/10 rounded-lg">
                                        Join the club to participate in the chat.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* SEASON TAB */}
                {activeTab === "season" && (
                    <div className="space-y-12">
                        <Card className="border-white/10 bg-surface/40">
                            <CardHeader>
                                <CardTitle>Club Leaderboard</CardTitle>
                                <CardDescription>Accumulated points from weekly victories.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg overflow-hidden border border-white/5 overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-white/5 text-muted-foreground uppercase tracking-wider font-bold text-[10px] md:text-xs">
                                            <tr>
                                                <th className="p-3 md:p-4">#</th>
                                                <th className="p-3 md:p-4">Player</th>
                                                <th className="p-3 md:p-4 text-right">
                                                    <span className="hidden sm:inline">Weekly Wins</span>
                                                    <span className="sm:hidden">Wins</span>
                                                </th>
                                                <th className="p-3 md:p-4 text-right">
                                                    <span className="hidden sm:inline">Total Points</span>
                                                    <span className="sm:hidden">Pts</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {seasonStandings.map((player, index) => {
                                                const member = members.find(m => m.userId === player.userId);
                                                const displayName = member?.displayName || player.displayName;
                                                const photoURL = member?.photoURL || player.photoURL;

                                                return (
                                                    <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-3 md:p-4 font-bold text-gray-500 text-xs md:text-sm">#{index + 1}</td>
                                                        <td className="p-3 md:p-4">
                                                            <div className="flex items-center gap-2 md:gap-3">
                                                                <UserAvatar
                                                                    photoURL={photoURL}
                                                                    displayName={displayName}
                                                                    xp={player.xp || 0}
                                                                    size="sm"
                                                                />
                                                                <span className="font-bold text-white text-xs md:text-sm truncate max-w-[80px] sm:max-w-none">{displayName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 md:p-4 text-right text-gray-400 font-bold text-xs md:text-sm">{player.wins || 0}</td>
                                                        <td className="p-3 md:p-4 text-right font-mono text-primary font-bold text-base md:text-lg">{player.points}</td>
                                                    </tr>
                                                )
                                            })}
                                            {(seasonStandings.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-muted-foreground text-xs">No points awarded yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Past Challenges History */}
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-muted-foreground" /> Past Challenges
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6 pb-20">
                                {pastSessions.length === 0 ? (
                                    <div className="col-span-full text-center py-10 text-muted-foreground bg-white/5 rounded-xl border border-white/5">
                                        <p>No completed challenges yet.</p>
                                    </div>
                                ) : (
                                    pastSessions.map((session) => (
                                        <Card key={session.id} className="border-white/10 bg-surface/30 backdrop-blur-sm overflow-hidden group">
                                            <div className="h-32 bg-black/50 relative">
                                                {(session.cover_image_url || session.gameTitle) && (
                                                    <Image
                                                        src={session.cover_image_url || getLibretroBoxartUrl(session.gameTitle || "", session.platform || "")}
                                                        alt={session.gameTitle || "Game Art"}
                                                        fill
                                                        className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                                                {isAdmin && (
                                                    <div className="absolute top-2 right-2 z-10">
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-600 border border-white/20"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteSession(session.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-white" />
                                                        </Button>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1">
                                                                {new Date(session.endDate).toLocaleDateString()}
                                                            </p>
                                                            <h3 className="text-xl font-bold text-white leading-tight truncate">{session.gameTitle}</h3>
                                                        </div>
                                                        <span className="bg-white/10 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                                            {session.challengeType === 'speed' ? 'Speedrun' : 'High Score'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <CardContent className="pt-4">
                                                <div className="space-y-3">
                                                    {session.topScores?.length > 0 ? (
                                                        session.topScores.map((score: any, index: number) => {
                                                            const member = members.find(m => m.userId === score.userId);
                                                            const displayName = member?.displayName || score.displayName;

                                                            return (
                                                                <div key={index} className="flex items-center justify-between text-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                                                    ${index === 0 ? 'bg-yellow-500 text-black' :
                                                                                index === 1 ? 'bg-gray-400 text-black' :
                                                                                    index === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white'}`}
                                                                        >
                                                                            {index + 1}
                                                                        </div>
                                                                        <span className={`font-medium ${index === 0 ? 'text-white' : 'text-muted-foreground'}`}>
                                                                            {displayName}
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-mono text-primary text-xs">
                                                                        {formatScore(score.scoreValue, session.challengeType)}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                    ) : (
                                                        <p className="text-center text-xs text-muted-foreground py-4 italic">No scores submitted</p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MEMBERS TAB */}
                {activeTab === "members" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {members.length === 0 ? (
                            <div className="col-span-full text-center py-20 text-muted-foreground bg-white/5 rounded-xl border border-white/5">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No members found.</p>
                            </div>
                        ) : (
                            members.map((member) => {
                                const isMe = user?.uid === member.userId;
                                const isFriend = friendsList.includes(member.userId);
                                const isPending = sentRequests.includes(member.userId);

                                return (
                                    <Card key={member.id} className="border-white/10 bg-surface/30 backdrop-blur-sm overflow-hidden group hover:border-primary/30 transition-all relative">
                                        <div className="p-6 flex flex-col items-center text-center">
                                            <UserAvatar
                                                photoURL={member.photoURL}
                                                displayName={member.displayName}
                                                xp={member.xp || 0}
                                                size="2xl"
                                                isWinner={club?.latestWinnerId === member.userId || (club?.latestWinnerName && club?.latestWinnerName === member.displayName)}
                                                className="mb-4"
                                            />
                                            <h3 className="font-bold text-white mb-1 flex items-center gap-2 justify-center">
                                                {member.displayName}
                                                {member.role === 'owner' && <Crown className="w-3 h-3 text-yellow-500" />}
                                            </h3>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-4">
                                                {member.role === 'owner' ? 'Club Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                                            </p>

                                            {!isMe && !isFriend && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className={`h-7 text-[10px] font-bold uppercase tracking-wider mb-4 ${isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary hover:text-black'}`}
                                                    disabled={isPending}
                                                    onClick={async () => {
                                                        if (!user) return;
                                                        try {
                                                            await sendFriendRequest(user.uid, member.userId);
                                                            setSentRequests(prev => [...prev, member.userId]);
                                                            alert("Friend request sent!");
                                                        } catch (e) {
                                                            console.error(e);
                                                            alert("Failed to send request");
                                                        }
                                                    }}
                                                >
                                                    {isPending ? (
                                                        <span className="flex items-center gap-1">Request Sent</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" /> Add Friend</span>
                                                    )}
                                                </Button>
                                            )}

                                            <div className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })
                        )}
                    </div>
                )}
            </div>
        </main >
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

export default function ClubPage() {
    return (
        <Suspense fallback={<div className="text-white text-center py-20">Loading...</div>}>
            <ClubContent />
        </Suspense>
    );
}
