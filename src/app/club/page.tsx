"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    getClub,
    getClubMembers,
    getActiveSessions, // Updated import
    getSessionScores,
    getSeasonStandings,
    leaveClub,
    submitScore,
    requestJoin,
    checkPendingRequest,
    getPastSessions,
    subscribeToClubMessages,
    sendClubMessage,
    type Message,
    deleteSession,
    updateLastVisitedClub,
    processSessionResults,
    checkAndActivateUpcomingSession,
    getCurrentGOTM,
    getUserGOTMReview,
    submitGOTMReview,
    getFriends,
    sendFriendRequest,
    type GOTM,
    type GOTMReview
} from "@/lib/firestore-service";
import { getLibretroBoxartUrl, PLACEHOLDER_BOXART_URL } from "@/lib/libretro-utils";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Share } from "@capacitor/share";
import { Gamepad2, Trophy, Users, Calendar, Crown, Shield, LogOut, Loader2, Check, Edit, Send, MessageSquare, Timer, Trash2, Share2, ArrowLeft, Star, ThumbsUp, ThumbsDown, UserPlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

function ClubContent() {
    const searchParams = useSearchParams();
    const clubId = searchParams.get('id');
    const { user } = useAuth();
    const router = useRouter();
    const [club, setClub] = useState<any>(null);
    const [activeSessions, setActiveSessions] = useState<any[]>([]); // Array of sessions
    const [selectedSession, setSelectedSession] = useState<any>(null); // Currently selected session
    const [game, setGame] = useState<any>(null);
    const [weekScores, setWeekScores] = useState<any[]>([]);
    const [pastSessions, setPastSessions] = useState<any[]>([]);
    const [seasonStandings, setSeasonStandings] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"overview" | "season" | "members" | "history" | "chat" | "gotm">("overview");
    const [scoreInput, setScoreInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    // Friend State
    const [friendsList, setFriendsList] = useState<string[]>([]);
    const [sentRequests, setSentRequests] = useState<string[]>([]);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isSending, setIsSending] = useState(false);

    // GOTM State
    const [gotm, setGotm] = useState<GOTM | null>(null);
    const [userReview, setUserReview] = useState<GOTMReview | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        text: "",
        ratings: {
            graphics: 5,
            sound: 5,
            gameplay: 5,
            story: 5,
            replayability: 5
        },
        recommend: true
    });

    useEffect(() => {
        if (user) {
            getFriends(user.uid).then(friends => {
                setFriendsList(friends.map(f => f.uid));
            });
        }
    }, [user]);

    const currentUserMembership = members.find(m => m.userId === user?.uid);

    const isOwner = currentUserMembership?.role === 'owner';
    const isAdmin = currentUserMembership?.role === 'admin' || isOwner;
    const isMember = !!currentUserMembership;

    const formatScore = (val: number, type: 'score' | 'speed' | 'custom') => {
        if (type === 'score' || type === 'custom' || !type) return val.toLocaleString();

        // Format seconds to MM:SS for speed challenges
        const minutes = Math.floor(val / 60);
        const seconds = val % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (user && clubId) {
            checkPendingRequest(user.uid, clubId as string).then(setIsPending);
            // Track last visited club
            updateLastVisitedClub(user.uid, clubId as string).catch(err => console.error("Failed to track visit", err));
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

    // Chat Logic
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (clubId) {
            const unsubscribe = subscribeToClubMessages(clubId as string, setMessages);
            return () => unsubscribe();
        }
    }, [clubId]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !user || !clubId) return;

        setIsSending(true);
        try {
            await sendClubMessage(clubId as string, user.uid, chatInput.trim(), {
                displayName: user.displayName || "Unknown",
                photoURL: user.photoURL || undefined
            });
            setChatInput("");
        } catch (error: any) {
            console.error("Failed to send message", error);
            alert("Failed to send: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleScoreSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedSession || !scoreInput) return;

        const score = parseInt(scoreInput);
        if (isNaN(score) || score <= 0) {
            alert("Please enter a valid positive number.");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitScore(
                selectedSession.id,
                user.uid,
                score,
                user.displayName || "Unknown Member"
            );

            setScoreInput(""); // Clear input

            // Refresh scores immediately
            const updatedScores = await getSessionScores(selectedSession.id);
            const sortedScores = [...updatedScores].sort((a, b) => {
                if (selectedSession.challengeType === 'speed') {
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

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm("Are you sure you want to delete this challenge? This cannot be undone.")) return;
        try {
            await deleteSession(sessionId);
            // Refresh past sessions
            const history = await getPastSessions(clubId as string);
            const historyWithScores = await Promise.all(history.map(async (s) => {
                const scores = await getSessionScores(s.id);
                const sorted = [...scores].sort((a, b) => {
                    if (s.challengeType === 'speed') return a.scoreValue - b.scoreValue;
                    return b.scoreValue - a.scoreValue;
                });
                return { ...s, topScores: sorted.slice(0, 3) };
            }));
            setPastSessions(historyWithScores);
            alert("Challenge deleted.");
        } catch (error) {
            console.error("Error deleting session:", error);
            alert("Failed to delete challenge.");
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

                // 3. Active Sessions
                const sessions = await getActiveSessions(clubId as string);
                setActiveSessions(sessions);

                // Default to the first session if available
                if (sessions.length > 0) {
                    setSelectedSession(sessions[0]);
                }
                // (Game and scores fetching moved to separate effect depending on selectedSession)

                // 6. Season Standings
                const standings = await getSeasonStandings(clubId as string);
                setSeasonStandings(standings);

                // 7. Past Challenges (History)
                const history = await getPastSessions(clubId as string);
                const historyWithScores = await Promise.all(history.map(async (s) => {
                    const scores = await getSessionScores(s.id);
                    const sorted = [...scores].sort((a, b) => {
                        if (s.challengeType === 'speed') return a.scoreValue - b.scoreValue;
                        return b.scoreValue - a.scoreValue;
                    });
                    return { ...s, topScores: sorted.slice(0, 3) };
                }));
                setPastSessions(historyWithScores);

                // 8. GOTM
                const activeGotm = await getCurrentGOTM(clubId as string);
                setGotm(activeGotm);
                if (activeGotm && user) {
                    const review = await getUserGOTMReview(activeGotm.id, user.uid);
                    setUserReview(review);
                }

            } catch (e) {
                console.error("Failed to load club data:", e);
            }
        };

        fetchClubData();
    }, [clubId]);

    // Welcome Message Logic
    useEffect(() => {
        if (clubId && user && isMember && club) {
            const key = `welcome_${clubId}_${user.uid}`;
            const hasSeenWelcome = localStorage.getItem(key);

            if (!hasSeenWelcome) {
                // Check if joined less than 24h ago
                const membership = members.find(m => m.userId === user.uid);
                if (membership && membership.joinedAt) {
                    const joinedAt = new Date(membership.joinedAt);
                    const now = new Date();
                    const diffHours = (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60);

                    if (diffHours < 24) {
                        alert(`🎉 Welcome to ${club.name}! \n\nWe're glad to have you here. Check out the current challenge and introduce yourself in the chat!`);
                        localStorage.setItem(key, 'true');
                    }
                }
            }
        }
    }, [clubId, user, isMember, club, members]);

    // Auto-Finish Logic: Check if Active Session is Expired
    useEffect(() => {
        const checkAndProcessExpired = async () => {
            if (!clubId) return;

            // 1. Process Expired Active Sessions
            if (activeSessions && activeSessions.length > 0) {
                for (const session of activeSessions) {
                    if (session.isActive && new Date(session.endDate) < new Date()) {
                        console.log(`Session ${session.id} expired. Processing results...`);
                        try {
                            await processSessionResults(session.id, clubId);
                            // After processing, check for upcoming sessions to activate
                            await checkAndActivateUpcomingSession(clubId);
                        } catch (e) {
                            console.error("Auto-process failed", e);
                        }
                    }
                }
            } else {
                // If no active session, check if we should activate one
                await checkAndActivateUpcomingSession(clubId);
            }
        };

        // Check on load and every minute
        checkAndProcessExpired();
        const interval = setInterval(checkAndProcessExpired, 60000);
        return () => clearInterval(interval);
    }, [activeSessions, clubId]);

    // Update game and scores when selectedSession changes
    useEffect(() => {
        const updateSessionData = async () => {
            if (!selectedSession) return;

            // Fetch Game Details
            if (selectedSession.gameId) {
                const { data: gameData } = await supabase.from('games').select('*').eq('id', selectedSession.gameId).single();
                if (gameData) setGame(gameData);
            } else {
                setGame({
                    title: selectedSession.gameTitle,
                    platform: selectedSession.platform,
                    cover_image_url: selectedSession.cover_image_url || null
                });
            }

            // Fetch Scores
            const scores = await getSessionScores(selectedSession.id);
            const sortedScores = [...scores].sort((a, b) => {
                // Primary Sort: Score Value
                if (selectedSession.challengeType === 'speed') {
                    if (a.scoreValue !== b.scoreValue) {
                        return a.scoreValue - b.scoreValue;
                    }
                } else {
                    if (a.scoreValue !== b.scoreValue) {
                        return b.scoreValue - a.scoreValue;
                    }
                }

                // Secondary Sort: Submission Time (Earlier is better)
                // If submittedAt is missing, treat as "infinity" (latest possible)
                const timeA = a.submittedAt ? (a.submittedAt.seconds || 0) : Number.MAX_SAFE_INTEGER;
                const timeB = b.submittedAt ? (b.submittedAt.seconds || 0) : Number.MAX_SAFE_INTEGER;

                return timeA - timeB;
            });
            setWeekScores(sortedScores);
        };

        updateSessionData();
    }, [selectedSession]);

    if (!clubId) return <div className="text-white text-center py-20">No club selected</div>;
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

                {/* Back Button */}
                <div className="absolute top-4 left-4 z-20">
                    <Link href="/" className="flex items-center text-white/70 hover:text-white transition-colors group bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:border-white/30">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
                    </Link>
                </div>
                <div className="container mx-auto max-w-4xl relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
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
                    <TabButton active={activeTab === "gotm"} onClick={() => setActiveTab("gotm")}>GOTM</TabButton>
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
                                        <CardDescription className="text-primary font-bold tracking-widest uppercase text-xs">Current Challenge</CardDescription>
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
                                                        // Fallback to a placeholder if image fails to load
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
                                        <p className="text-gray-300 mb-6 font-medium italic">
                                            {selectedSession?.challengeType === 'speed'
                                                ? "Speed Trial: Submit your fastest time. Record setting runs required!"
                                                : "High Score: Submit your best points total. Top the charts!"}
                                        </p>

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

                            </div>

                            {/* Sidebar: Weekly Leaderboard (Members Only) */}
                            <div className="space-y-6">
                                {isMember ? (
                                    <Card className="border-white/5 bg-gradient-to-b from-surface to-black">
                                        <CardHeader>
                                            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-yellow-500" /> Current Challenge
                                                </div>
                                                {isAdmin && (
                                                    <Link href={`/club/admin?id=${clubId}&tab=game`}>
                                                        <Edit className="w-3 h-3 hover:text-white cursor-pointer transition-colors" />
                                                    </Link>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {weekScores.slice(0, 5).map((score, i) => {
                                                const member = members.find(m => m.userId === score.userId);
                                                const displayName = member?.displayName || score.displayName;

                                                return (
                                                    <div key={score.id} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold ${i === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{i + 1}.</span>
                                                            <span className="text-white truncate max-w-[120px]">{displayName}</span>
                                                        </div>
                                                        <span className="font-mono text-primary font-bold">
                                                            {formatScore(score.scoreValue, selectedSession?.challengeType)}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                            {(weekScores.length === 0) && <div className="text-xs text-muted-foreground italic">No scores yet. Be the first!</div>}
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary/80">
                                        <p className="font-bold mb-1 flex items-center gap-2"><Trophy className="w-3 h-3" /> Members Only</p>
                                        Sign in and join the club to see the live leaderboard and submit your scores!
                                    </div>
                                )}

                                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                                    <p className="font-bold mb-1 flex items-center gap-2"><Crown className="w-3 h-3" /> How to win points?</p>
                                    Finish in the top 3 at the end of a challenge to earn <span className="text-white font-bold">Club Points</span>.
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
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 overflow-hidden mt-1 border border-white/10">
                                                {msg.photoURL ? (
                                                    <Image src={msg.photoURL} alt={msg.displayName} width={32} height={32} className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                                                        {msg.displayName?.[0]}
                                                    </div>
                                                )}
                                            </div>
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
                                                                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] md:text-xs overflow-hidden shrink-0">
                                                                    {photoURL ? (
                                                                        <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        displayName?.[0]
                                                                    )}
                                                                </div>
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
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-white/10 mb-4 flex items-center justify-center overflow-hidden">
                                                {member.photoURL ? (
                                                    <Image src={member.photoURL} alt={member.displayName} width={80} height={80} className="object-cover w-full h-full" />
                                                ) : (
                                                    <span className="text-2xl font-bold text-gray-500">{member.displayName?.[0] || "?"}</span>
                                                )}
                                            </div>
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

                {activeTab === "gotm" && gotm && (
                    <div className="animate-fade-in-up space-y-6">
                        <Card className="border-purple-500/20 bg-surface/40 backdrop-blur-md overflow-hidden">
                            <div className="absolute inset-0 z-0">
                                {gotm.coverUrl && (
                                    <Image
                                        src={gotm.coverUrl}
                                        alt="Background"
                                        fill
                                        className="object-cover opacity-10 blur-xl scale-110"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                            </div>

                            <CardHeader className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/30">
                                        Game of the Month
                                    </div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> Ends {new Date(gotm.endDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <CardTitle className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2">{gotm.title}</CardTitle>
                                <CardDescription className="flex items-center gap-4 text-lg">
                                    <span className="text-white font-bold">{gotm.platform}</span>
                                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                                    <span>{gotm.year}</span>
                                    {gotm.developer && (
                                        <>
                                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                                            <span>{gotm.developer}</span>
                                        </>
                                    )}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="relative z-10 space-y-8">
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="w-full md:w-64 shrink-0">
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

                                    <div className="flex-1 space-y-6">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2">Mission Briefing</h3>
                                        <p className="text-gray-300 leading-relaxed text-lg">
                                            {gotm.description || "No specific briefing for this title. Explore the game and report back, soldier!"}
                                        </p>

                                        <div className="pt-4">
                                            {!userReview ? (
                                                (() => {
                                                    const now = new Date();
                                                    const end = new Date(gotm.endDate);
                                                    const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                                                    // Allow review in last 10 days or after end data
                                                    const isReviewPeriod = diffDays <= 10;

                                                    if (!isReviewPeriod) {
                                                        return (
                                                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                                                                <strong className="block uppercase tracking-widest text-xs mb-1">Status: Active Mission</strong>
                                                                Reviews will unlock during the final designated operational window (last 10 days of the month).
                                                            </div>
                                                        );
                                                    }

                                                    if (isReviewOpen) {
                                                        return (
                                                            <div className="bg-black/40 border border-white/10 rounded-xl p-6 animate-fade-in-up">
                                                                <h4 className="text-lg font-bold text-white mb-4 uppercase tracking-widest">Submit Your Report</h4>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
                                                                    {(['graphics', 'sound', 'gameplay', 'story', 'replayability'] as const).map(cat => (
                                                                        <div key={cat} className="space-y-2">
                                                                            <div className="flex justify-between">
                                                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{cat}</label>
                                                                                <span className="text-xs font-mono font-bold text-primary">{reviewForm.ratings[cat]}/11</span>
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
                                                                                className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="mb-6 space-y-3">
                                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Would you recommend this?</label>
                                                                    <div className="flex gap-4">
                                                                        <Button
                                                                            type="button"
                                                                            variant={reviewForm.recommend ? "default" : "outline"}
                                                                            onClick={() => setReviewForm(prev => ({ ...prev, recommend: true }))}
                                                                            className={reviewForm.recommend ? "bg-green-500 hover:bg-green-600 text-white" : "border-white/10 text-muted-foreground"}
                                                                        >
                                                                            <ThumbsUp className="w-4 h-4 mr-2" /> YES
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant={!reviewForm.recommend ? "destructive" : "outline"}
                                                                            onClick={() => setReviewForm(prev => ({ ...prev, recommend: false }))}
                                                                            className={!reviewForm.recommend ? "" : "border-white/10 text-muted-foreground"}
                                                                        >
                                                                            <ThumbsDown className="w-4 h-4 mr-2" /> NO
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                <div className="mb-6 space-y-2">
                                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mini Review</label>
                                                                    <textarea
                                                                        value={reviewForm.text}
                                                                        onChange={e => setReviewForm(prev => ({ ...prev, text: e.target.value }))}
                                                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary/50 h-24 resize-none"
                                                                        placeholder="Share your thoughts on this classic..."
                                                                    />
                                                                </div>

                                                                <div className="flex gap-3">
                                                                    <Button
                                                                        onClick={async () => {
                                                                            if (!reviewForm.text.trim()) return alert("Please write a short review.");
                                                                            try {
                                                                                setIsSubmitting(true);
                                                                                if (user && gotm) { // Check both to satisfy TS
                                                                                    await submitGOTMReview(clubId as string, gotm.id, user.uid, {
                                                                                        ...reviewForm,
                                                                                        reviewText: reviewForm.text,
                                                                                        displayName: user.displayName || "Unknown",
                                                                                        photoURL: user.photoURL || undefined
                                                                                    });
                                                                                    alert("Review posted! 📝");
                                                                                    // Refresh
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
                                                                        className="flex-1 font-bold uppercase tracking-widest"
                                                                    >
                                                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                                                        Submit Review
                                                                    </Button>
                                                                    <Button variant="ghost" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <Button onClick={() => setIsReviewOpen(true)} className="w-full md:w-auto font-bold uppercase tracking-widest neon-border-static">
                                                                <Edit className="w-4 h-4 mr-2" /> Write a Review
                                                            </Button>
                                                        );
                                                    }
                                                })()
                                            ) : (
                                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="text-green-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                                <Check className="w-4 h-4" /> Review Submitted
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground mt-1">Thank you for your feedback!</p>
                                                        </div>
                                                        <div className="text-right">
                                                            {userReview.recommend ? (
                                                                <span className="flex items-center gap-1 text-green-400 font-bold uppercase text-xs">
                                                                    <ThumbsUp className="w-3 h-3" /> Recommended
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-red-400 font-bold uppercase text-xs">
                                                                    <ThumbsDown className="w-3 h-3" /> Not Recommended
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-5 gap-2 mb-4 text-center">
                                                        {(['graphics', 'sound', 'gameplay', 'story', 'replayability'] as const).map(cat => (
                                                            <div key={cat} className="bg-black/20 p-2 rounded">
                                                                <div className="text-[8px] uppercase font-bold text-muted-foreground mb-1">{cat.slice(0, 4)}</div>
                                                                <div className="text-sm font-mono font-bold text-white">{userReview.ratings[cat]}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-sm text-gray-300 italic">"{userReview.reviewText}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "gotm" && !gotm && (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>No Game of the Month is currently active.</p>
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
