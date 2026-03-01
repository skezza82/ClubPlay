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
    getXpLevel,
    addXp,
    getPastGOTMs,
    getGOTMReviews,
    getJoinRequests,
    subscribeToJoinRequests,
    unfriend,
    sendClubInvite,
    checkAndActivateUpcomingSession,
    checkAndEndActiveSessions,
    updateClubLastAccessed,
    uploadVerificationImage
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
    UserX,
    Info,
    Star,
    Settings,
    Share2,
    LayoutDashboard
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GOTMHistoryModal } from "@/components/GOTMHistoryModal";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";


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
            const target = targetDate?.toDate ? targetDate.toDate().getTime() : new Date(targetDate).getTime();
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


const formatScore = (val: any, type?: string) => {
    if (val === undefined || val === null) return "---";
    const num = typeof val === 'number' ? val : parseFloat(val) || 0;

    if (type === 'speed') {
        const mins = Math.floor(num / 60);
        const secs = Math.floor(num % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return num.toLocaleString();
};

function HowToWin() {
    return (
        <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crown className="w-12 h-12 text-blue-400" />
            </div>
            <p className="font-black mb-3 flex items-center gap-2 uppercase tracking-widest text-blue-400 italic text-[10px]">
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
                    <span><span className="text-primary font-bold text-[9px]">Bonus Tip:</span> Being the first to post a score rewards <span className="text-white">Extra XP</span>!</span>
                </p>
            </div>
        </div>
    );
}

function HowToWinModal({ onClose }: { onClose: () => void }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 500);
    };

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? 'opacity-100 backdrop-blur-xl' : 'opacity-0 pointer-events-none'}`}
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={handleClose}
        >
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] transition-all duration-1000 ${isVisible ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} />

            <div
                className={`relative max-w-sm w-full bg-surface/50 border border-blue-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] transition-all duration-700 transform ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-20 scale-90 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-1 italic">Club Rules</h2>
                        <h3 className="text-3xl font-black text-white italic tracking-tighter">HOW TO WIN</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/10">
                        <Crown className="w-6 h-6 text-blue-400" />
                    </div>
                </div>

                <ul className="space-y-6 mb-8">
                    {[
                        { pos: "1", text: "Finish 1st for maximum Club Points and the Weekly Trophy.", color: "bg-yellow-500", textColor: "text-black" },
                        { pos: "2", text: "Secure 2nd place for a significant points boost.", color: "bg-slate-400", textColor: "text-black" },
                        { pos: "3", text: "Hold 3rd place for consistent season progression.", color: "bg-amber-700", textColor: "text-white" },
                        { pos: "4+", text: "Players 4th and below score 25 points for participation.", color: "bg-blue-500/50", textColor: "text-white" }
                    ].map((item, i) => (
                        <li key={i} className="flex gap-4 items-start">
                            <span className={`w-8 h-8 rounded-full ${item.color} ${item.textColor} flex items-center justify-center font-black shrink-0 text-xs shadow-lg`}>
                                {item.pos}
                            </span>
                            <span className="text-blue-100/90 text-sm leading-relaxed font-medium">
                                {item.text}
                            </span>
                        </li>
                    ))}
                </ul>

                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Star className="w-8 h-8 text-primary" />
                    </div>
                    <p className="flex items-center gap-3 text-xs text-blue-200 relative z-10">
                        <span className="text-primary text-lg">💡</span>
                        <span><span className="text-primary font-bold">Bonus Tip:</span> Being the first to post a score rewards <span className="text-white font-bold">Extra XP</span>!</span>
                    </p>
                </div>

                <Button
                    onClick={handleClose}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] py-6 rounded-xl text-lg shadow-[0_4px_20px_rgba(59,130,246,0.3)] transition-all active:scale-95 border-b-4 border-blue-800"
                >
                    Get Back In
                </Button>
            </div>
        </div>
    );
}

function ClubInviteModal({ isOpen, onClose, club, members, friends, user }: any) {
    const [invitingId, setInvitingId] = useState<string | null>(null);

    const handleInvite = async (friendId: string, friendName: string) => {
        if (!user || !club) return;
        setInvitingId(friendId);
        try {
            await sendClubInvite(
                club.id,
                club.name,
                user.uid,
                user.displayName || "Unknown User",
                friendId
            );
            alert(`Invite sent to ${friendName}!`);
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Failed to send invite.");
        } finally {
            setInvitingId(null);
        }
    };

    if (!isOpen) return null;

    // Filter out friends who are already members
    const eligibleFriends = friends.filter((f: any) => !members.some((m: any) => m.userId === f.uid));

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all" onClick={onClose}>
            <div className="relative w-full max-w-md bg-surface/80 border border-primary/30 rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white"
                >
                    ×
                </button>
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-black italic uppercase">Invite Friends</h3>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">Recruit members to {club.name}</p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {eligibleFriends.length === 0 ? (
                        <p className="text-center text-white/50 py-8 italic">All your friends are already in this club, or you have no friends to invite!</p>
                    ) : (
                        eligibleFriends.map((friend: any) => (
                            <div key={friend.uid} className="flex flex-row items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <UserAvatar photoURL={friend.photoURL} displayName={friend.displayName} xp={friend.xp} size="sm" />
                                    <div className="text-left">
                                        <div className="font-bold text-sm text-white">{friend.displayName}</div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleInvite(friend.uid, friend.displayName)}
                                    disabled={invitingId === friend.uid}
                                    className="h-8 bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/30 transition-all"
                                >
                                    {invitingId === friend.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function UserProfileModal({ user: profileUser, onClose, currentUser, isFriend, isPending, onSendRequest, onUnfriend }: {
    user: any,
    onClose: () => void,
    currentUser: any,
    isFriend: boolean,
    isPending: boolean,
    onSendRequest: (userId: string) => Promise<void>,
    onUnfriend: (userId: string) => Promise<void>
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 500);
    };

    const isMe = currentUser?.uid === profileUser.userId;

    return (
        <div
            className={`fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? 'opacity-100 backdrop-blur-xl' : 'opacity-0 pointer-events-none'}`}
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={handleClose}
        >
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] transition-all duration-1000 ${isVisible ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} />

            <div
                className={`relative max-w-sm w-full bg-surface/50 border border-primary/30 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] transition-all duration-700 transform ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-20 scale-90 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <span className="text-xl">×</span>
                </button>

                <div className="relative mb-6 flex justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-dim p-0.5 border border-white/20 shadow-xl overflow-hidden">
                        <UserAvatar
                            uid={profileUser.userId}
                            photoURL={profileUser.photoURL}
                            displayName={profileUser.displayName}
                            className="w-full h-full rounded-[14px]"
                            size="full"
                            showLevel={false}
                        />
                    </div>
                    {isFriend && (
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-black px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-lg">
                            <Star className="w-3 h-3 fill-black" /> Friend
                        </div>
                    )}
                </div>

                <h3 className="text-3xl font-black text-white italic tracking-tighter mb-1 uppercase">
                    {profileUser.displayName}
                </h3>
                <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 italic">
                    {profileUser.title || "Club Member"}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                        <div className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-widest text-left">Level</div>
                        <div className="text-2xl font-black text-white italic tracking-tighter text-left">
                            LVL {getXpLevel(profileUser.xp || 0)}
                        </div>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                        <div className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-widest text-left">Joined</div>
                        <div className="text-2xl font-black text-white italic tracking-tighter text-left">
                            {new Date(profileUser.joinedAt || Date.now()).getFullYear()}
                        </div>
                    </div>
                </div>

                {!isMe && !isFriend && (
                    <Button
                        onClick={() => onSendRequest(profileUser.userId)}
                        disabled={isPending}
                        className="w-full bg-primary hover:bg-primary-dim text-white font-black uppercase tracking-[0.2em] py-6 rounded-xl text-lg shadow-[0_4px_20px_rgba(var(--primary-rgb),0.3)] transition-all active:scale-95 border-b-4 border-primary-dim"
                    >
                        {isPending ? "Request Sent" : <span className="flex items-center justify-center gap-2"><UserPlus className="w-5 h-5" /> Add Friend</span>}
                    </Button>
                )}

                {isFriend && (
                    <div className="flex gap-3">
                        <Button
                            disabled
                            className="flex-1 bg-green-500/20 text-green-500 font-black uppercase tracking-[0.2em] py-6 rounded-xl text-lg opacity-50 border border-green-500/20"
                        >
                            Already Friends
                        </Button>
                        <button
                            onClick={() => onUnfriend(profileUser.userId)}
                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                            title="Unfriend"
                        >
                            <UserX className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {isMe && (
                    <Button
                        disabled
                        className="w-full bg-primary/20 text-primary font-black uppercase tracking-[0.2em] py-6 rounded-xl text-lg opacity-50 border border-primary/20"
                    >
                        It&apos;s You!
                    </Button>
                )}
            </div>
        </div>
    );
}

function ClubContent() {
    const searchParams = useSearchParams();
    const clubId = searchParams.get("id");
    const initialTab = searchParams.get("tab") as "overview" | "season" | "members" | "gotm" || "overview";
    const { user } = useAuth();
    const router = useRouter();
    const [isPendingJoin, setIsPendingJoin] = useState(false);
    const [showBio, setShowBio] = useState(false);
    const [showHowTo, setShowHowTo] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

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
    const [activeTab, setActiveTab] = useState<"overview" | "season" | "members" | "gotm">(initialTab);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [bannerError, setBannerError] = useState(false);

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
    const [pastGOTMs, setPastGOTMs] = useState<any[]>([]);
    const [selectedPastGOTM, setSelectedPastGOTM] = useState<any>(null);

    const [isRequesting, setIsRequesting] = useState(false);
    const [sentRequests, setSentRequests] = useState<string[]>([]);
    const [friendsList, setFriendsList] = useState<string[]>([]);
    const [friendsData, setFriendsData] = useState<any[]>([]);

    // Score Verification
    const [pendingVerificationScore, setPendingVerificationScore] = useState<{ scoreValue: number, sessionId: string } | null>(null);
    const [verificationImage, setVerificationImage] = useState<File | null>(null);
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    const [isVerifyingAI, setIsVerifyingAI] = useState(false);

    useEffect(() => {
        if (!clubId) {
            setLoading(false);
            return;
        }

        const setSessionsState = (sessions: any[], now: Date) => {
            const active = sessions.filter(s => s.isActive && !s.isProcessed && (s.endDate ? new Date(s.endDate) > now : true));
            const pastRaw = sessions.filter(s => s.isProcessed || (!s.isActive && (s.endDate ? new Date(s.endDate) <= now : true))).sort((a, b) => {
                const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
                const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
                return dateB - dateA;
            });

            // Enrich only recent past sessions to save performance
            const enrich = async () => {
                const recentPast = pastRaw.slice(0, 10);
                const pastEnriched = await Promise.all(recentPast.map(async (session) => {
                    try {
                        const scores = await getClubSessionScores(session.id);
                        const sorted = [...scores].sort((a, b) => {
                            if (session.challengeType === 'speed') {
                                return (a.scoreValue || 0) - (b.scoreValue || 0);
                            }
                            return (b.scoreValue || 0) - (a.scoreValue || 0);
                        });
                        return {
                            ...session,
                            topScores: sorted.slice(0, 3),
                            challengeType: session.challengeType || 'score'
                        };
                    } catch (e) {
                        console.error(`Error fetching scores for session ${session.id}:`, e);
                        return { ...session, topScores: [] };
                    }
                }));

                // Append the remaining non-enriched sessions if needed, or just show top 10
                const remainingRaw = pastRaw.slice(10).map(s => ({ ...s, topScores: [] }));

                setActiveSessions(active);
                setPastSessions([...pastEnriched, ...remainingRaw]);

                // Default selection logic
                if (active.length > 0) {
                    setSelectedSession(active[0]);
                } else if (pastRaw.length > 0) {
                    setSelectedSession(pastRaw[0]);
                }
            };
            enrich();
        };

        const fetchData = async () => {
            try {
                setLoading(true);
                const clubData = await getClub(clubId);
                setClub(clubData);

                // Check for scheduled sessions that should be active
                await checkAndActivateUpcomingSession(clubId);
                // Auto-end expired sessions
                await checkAndEndActiveSessions(clubId);

                const membersData = await getClubMembers(clubId);
                setMembers(membersData);

                const sessions = await getClubSessions(clubId);
                const now = new Date();

                setSessionsState(sessions, now);

                const standings = await getSeasonStandings(clubId);
                setSeasonStandings(standings);

                const gotmData = await getGameOfTheMonth(clubId);
                setGotm(gotmData);

                const pastG = await getPastGOTMs(clubId);
                setPastGOTMs(pastG);

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
                    setFriendsData(friends);
                    setFriendsList(friends.map(f => f.uid));

                    // Fetch pending requests count if admin and mark club as accessed
                    const userMembership = membersData.find((m: any) => m.userId === user.uid);
                    if (userMembership) {
                        updateClubLastAccessed(user.uid, clubId);

                        if (userMembership.role === 'admin' || userMembership.role === 'owner') {
                            const requests = await getJoinRequests(clubId);
                            setPendingRequestsCount(requests.length);
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading club details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [clubId, user]);

    useEffect(() => {
        if (selectedSession && members.length > 0) {
            getClubSessionScores(selectedSession.id).then(scores => {
                // 1. Create a map of existing submissions for quick lookup
                const scoreMap = new Map(scores.map((s: any) => [s.userId, s]));

                // 2. Build a complete list of entries based on all members
                const allEntries = members.map((m: any) => {
                    const submission: any = scoreMap.get(m.userId);

                    if (!submission) {
                        return {
                            id: `unsubmitted-${m.userId}`,
                            userId: m.userId,
                            displayName: m.displayName,
                            photoURL: m.photoURL,
                            xp: m.xp,
                            scoreValue: null,
                            status: 'none',
                            submittedAt: null
                        };
                    }

                    // Handle verified fallback for pending/rejected
                    if (submission.verifiedScoreValue !== undefined && (submission.status === 'pending_verification' || submission.status === 'rejected')) {
                        return {
                            ...submission,
                            displayName: m.displayName,
                            xp: m.xp,
                            scoreValue: submission.verifiedScoreValue,
                            status: 'verified'
                        };
                    }

                    // Filter out pending scores without fallback (treat as no score for ranking)
                    if (submission.status === 'pending_verification' || submission.status === 'rejected') {
                        return {
                            ...submission,
                            displayName: m.displayName,
                            xp: m.xp,
                            scoreValue: null
                        };
                    }

                    return { ...submission, displayName: m.displayName, xp: m.xp };
                });

                // 3. Sort the entire list
                allEntries.sort((a, b) => {
                    // Secondary Sort: Name (Alphabetical A-Z)
                    const nameA = (a.displayName || "").toLowerCase();
                    const nameB = (b.displayName || "").toLowerCase();

                    // Primary Sort: Score
                    if (a.scoreValue !== null && b.scoreValue !== null) {
                        if (a.scoreValue !== b.scoreValue) {
                            if (selectedSession.challengeType === 'speed') {
                                return a.scoreValue - b.scoreValue;
                            }
                            return b.scoreValue - a.scoreValue;
                        }
                        return nameA.localeCompare(nameB);
                    }

                    // Nulls go to the bottom
                    if (a.scoreValue === null && b.scoreValue !== null) return 1;
                    if (a.scoreValue !== null && b.scoreValue === null) return -1;

                    // Both null? Sort alphabetically by name
                    return nameA.localeCompare(nameB);
                });

                setWeekScores(allEntries);
            });
        }
    }, [selectedSession, clubId, members]);

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

    useEffect(() => {
        if (clubId && isAdmin) {
            const unsubscribe = subscribeToJoinRequests(clubId, (requests: any[]) => {
                setPendingRequestsCount(requests.length);
            });
            return () => unsubscribe();
        }
    }, [clubId, isAdmin, subscribeToJoinRequests]);

    const isSessionActive = selectedSession && selectedSession.isActive;
    const isSessionUpcoming = selectedSession && !selectedSession.isActive && !selectedSession.isProcessed;

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
            const result = await submitScore(selectedSession.id, user.uid, parseInt(scoreInput), user.displayName || "Unknown User");

            if (result.isOutlier) {
                setPendingVerificationScore({ sessionId: selectedSession.id, scoreValue: parseInt(scoreInput) });
                setIsSubmitting(false);
                return; // Stop here, show verification modal
            }

            const updatedScores = await getClubSessionScores(selectedSession.id);
            const sorted = [...updatedScores].sort((a, b) => {
                if (selectedSession.challengeType === 'speed') {
                    return (a.scoreValue || 0) - (b.scoreValue || 0);
                }
                return (b.scoreValue || 0) - (a.scoreValue || 0);
            });
            // Filter out pending and rejected verification scores from the public board
            setWeekScores(sorted.filter(s => s.status !== 'pending_verification' && s.status !== 'rejected'));
            setScoreInput("");
            alert("Score submitted successfully! 🎮");
        } catch (error) {
            console.error(error);
            alert("Failed to submit score");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProofSubmit = async () => {
        if (!user || !pendingVerificationScore || !verificationImage) return;
        setIsUploadingProof(true);
        try {
            await uploadVerificationImage(pendingVerificationScore.sessionId, user.uid, verificationImage);

            // Trigger AI Verification
            setIsVerifyingAI(true);
            const scoreId = `${user.uid}_${pendingVerificationScore.sessionId}`;
            try {
                // Use Cloud Function for production support (works with static export)
                const functionsBase = process.env.NEXT_PUBLIC_FUNCTIONS_URL;
                const verifyUrl = functionsBase
                    ? functionsBase.replace('searchGames', 'verifyScore')
                    : '/api/verify-score';

                const res = await fetch(verifyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scoreId })
                });
                const data = await res.json();

                if (data.status === 'verified') {
                    alert("AI Verified! ✅ Your score has been added to the leaderboard.");
                    // Refresh scores to show the new one immediately
                    if (selectedSession) {
                        const updated = await getClubSessionScores(selectedSession.id);
                        setWeekScores(updated.filter(s => s.status === 'verified'));
                    }
                } else if (data.status === 'rejected') {
                    alert(`AI Review Result: Rejected. ❌ ${data.aiResult?.reasoning || "Please try again with a clearer photo."}`);
                } else {
                    alert("Proof uploaded! 📤 AI analysis complete but needs human review. Your score is pending Admin Review.");
                }
            } catch (aiErr) {
                console.warn("AI Verification call failed:", aiErr);
                alert("Proof uploaded successfully! Your score is pending Admin Review.");
            } finally {
                setIsVerifyingAI(false);
            }

            setPendingVerificationScore(null);
            setVerificationImage(null);
            setScoreInput("");
        } catch (e) {
            console.error(e);
            alert("Failed to upload proof.");
        } finally {
            setIsUploadingProof(false);
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

    const handleShareClub = async () => {
        if (!club) return;

        // Use production URL if on native platform to avoid localhost issue
        const baseUrl = Capacitor.isNativePlatform()
            ? "https://clubplay.web.app"
            : window.location.origin;

        const shareUrl = `${baseUrl}/club?id=${club.id}`;

        const shareData = {
            title: `Join ${club.name} on Club Play!`,
            text: `Come join my club "${club.name}" and compete in retro game challenges!`,
            url: shareUrl,
            dialogTitle: `Share ${club.name}`
        };

        const fallbackCopy = async () => {
            // Try modern clipboard API if available and secure
            if (navigator.clipboard && window.isSecureContext) {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    alert("Club link copied to clipboard!");
                    return;
                } catch (err) {
                    console.error("Clipboard copy failed:", err);
                }
            }

            // Fallback for non-secure contexts (local IP testing on Android)
            try {
                const textArea = document.createElement("textarea");
                textArea.value = shareUrl;
                textArea.style.position = "fixed";
                textArea.style.top = "0";
                textArea.style.left = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    alert("Club link copied to clipboard!");
                } else {
                    alert(`Please manually share this link: ${shareUrl}`);
                }
            } catch (err) {
                console.error('Fallback copy failed', err);
                alert(`Please manually share this link: ${shareUrl}`);
            }
        };

        try {
            if (Capacitor.isNativePlatform() && (await Share.canShare()).value) {
                await Share.share(shareData);
            } else if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await fallbackCopy();
            }
        } catch (err) {
            console.error('Error sharing:', err);
            // If user cancels, it throws AbortError (web). 
            // Handle if it's an error.
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            // Fallback if NotAllowedError or any other error
            await fallbackCopy();
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
            <div className="relative h-[25vh] min-h-[180px] overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
                    <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10" />
                    {club.bannerUrl && !bannerError ? (
                        <Image
                            src={club.bannerUrl}
                            alt={club.name}
                            fill
                            className="object-cover scale-100"
                            priority
                            loading="eager"
                            onError={() => setBannerError(true)}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black" />
                    )}
                </div>

                <div className="relative z-20 h-full container mx-auto max-w-3xl px-6 flex flex-col items-center text-center justify-end pb-4">
                    <div className="flex flex-col items-center gap-3 mb-4">
                        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg transform rotate-3 overflow-hidden mb-1">
                            {club.logoUrl ? (
                                <Image
                                    src={club.logoUrl}
                                    alt={club.name}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                    priority
                                    loading="eager"
                                />
                            ) : (
                                <Users className="w-10 h-10 text-black" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic">
                                {club.name}
                            </h1>
                            <div className="flex items-center justify-center gap-3 text-muted-foreground font-bold tracking-widest text-xs uppercase mt-2">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {members.length} Members</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span>Est. {new Date(club.createdAt).getFullYear()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-2 flex-wrap">
                        {isAdmin && (
                            <Link href={`/club/admin?id=${clubId}`}>
                                <Button variant="ghost" className="border border-white/10 text-white hover:bg-white/10 relative h-10 w-10 p-0" title="Admin Dashboard">
                                    <Settings className="w-4 h-4" />
                                    {pendingRequestsCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-black text-[9px] font-black border border-surface z-20 shadow-[0_0_10px_rgba(102,252,241,0.5)] animate-pulse">
                                            {pendingRequestsCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                        )}
                        {isMember && (
                            <Button variant="outline" size="icon" className="border-primary/30 text-primary hover:bg-primary/20" onClick={() => setShowInviteModal(true)} title="Invite Friends">
                                <UserPlus className="w-4 h-4" />
                            </Button>
                        )}
                        {isMember ? (
                            <Button variant="outline" size="icon" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={handleLeave} title="Leave Club">
                                <LogOut className="w-4 h-4" />
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
                            className="border-white/10 text-white hover:bg-white/10"
                            onClick={() => setShowBio(!showBio)}
                            title="Club Bio"
                        >
                            <Info className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-white/10 text-white hover:bg-white/10"
                            onClick={handleShareClub}
                            title="Share Club"
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>

                    </div>
                </div>
            </div>

            {/* Club Bio Overlay */}
            {/* Verification Modal */}
            {pendingVerificationScore && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface border border-primary/30 rounded-3xl p-6 shadow-2xl max-w-md w-full">
                        <h3 className="text-2xl font-black italic uppercase text-white mb-2 text-center text-primary">Verification Required</h3>
                        <p className="text-sm text-blue-100/70 mb-6 text-center">
                            Your score of <strong className="text-white text-lg">{pendingVerificationScore.scoreValue}</strong> is exceptionally high! To maintain leaderboard integrity, please upload a photo of your screen showing the score alongside your handwritten username.
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            className="w-full mb-6 text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary file:text-black hover:file:bg-primary-dim transition-all outline-none"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setVerificationImage(e.target.files[0]);
                                }
                            }}
                        />
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white" onClick={() => { setPendingVerificationScore(null); setVerificationImage(null); }} disabled={isUploadingProof || isVerifyingAI}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-primary text-black hover:bg-primary-dim transition-all disabled:opacity-50"
                                disabled={!verificationImage || isUploadingProof || isVerifyingAI}
                                onClick={handleProofSubmit}
                            >
                                {isUploadingProof ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...</>
                                ) : isVerifyingAI ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> AI Reviewing...</>
                                ) : (
                                    'Submit Proof'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showBio && (
                <div className="container mx-auto max-w-3xl px-6 -mt-4 mb-4 animate-fade-in">
                    <Card className="border-primary/20 bg-surface/80 backdrop-blur-xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4">
                            <Button variant="ghost" size="icon" onClick={() => setShowBio(false)} className="text-muted-foreground hover:text-white">
                                <span className="text-xl">×</span>
                            </Button>
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                <Info className="w-3 h-3" /> Mission & Bio
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden border border-white/5">
                                    {club.logoUrl ? (
                                        <Image src={club.logoUrl} alt={club.name} width={48} height={48} className="w-full h-full object-cover" priority loading="eager" />
                                    ) : (
                                        <Users className="w-6 h-6 text-primary" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-white text-lg">{club.name}</h4>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                        INVITE CODE: <span className="text-primary">{club.inviteCode}</span>
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-white/90 leading-relaxed italic border-l-2 border-primary/30 pl-4 py-1">
                                {club.bio || "No mission statement provided. Join us and help define our legacy!"}
                            </p>

                            <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-2">
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-3 h-3 text-primary" /> {members.length} Members
                                </div>
                                <div className="w-1 h-1 bg-white/10 rounded-full" />
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 text-primary" /> Est. {new Date(club.createdAt).getFullYear()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showHowTo && (
                <HowToWinModal onClose={() => setShowHowTo(false)} />
            )}

            <ClubInviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                club={club}
                members={members}
                friends={friendsData}
                user={user}
            />

            {selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    currentUser={user}
                    isFriend={friendsList.includes(selectedUser.userId)}
                    isPending={sentRequests.includes(selectedUser.userId)}
                    onClose={() => setSelectedUser(null)}
                    onSendRequest={async (targetId) => {
                        if (!user) return;
                        try {
                            await sendFriendRequest(user.uid, targetId);
                            setSentRequests(prev => [...prev, targetId]);
                        } catch (e) {
                            console.error(e);
                            alert("Failed to send request");
                        }
                    }}
                    onUnfriend={async (targetId) => {
                        if (!user) return;
                        if (!confirm("Are you sure you want to unfriend this player?")) return;
                        try {
                            await unfriend(user.uid, targetId);
                            setFriendsList(prev => prev.filter(id => id !== targetId));
                        } catch (e) {
                            console.error(e);
                            alert("Failed to unfriend");
                        }
                    }}
                />
            )}

            {/* Navigation */}
            <div className="container mx-auto max-w-3xl px-6 mt-2 mb-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-1">
                    <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<LayoutDashboard className="w-4 h-4" />}>Overview</TabButton>
                    <TabButton active={activeTab === "season"} onClick={() => setActiveTab("season")} icon={<Trophy className="w-4 h-4" />}>Leaderboard</TabButton>
                    <TabButton active={activeTab === "members"} onClick={() => setActiveTab("members")} icon={<Users className="w-4 h-4" />}>Members</TabButton>
                    <TabButton active={activeTab === "gotm"} onClick={() => setActiveTab("gotm")} icon={<Star className="w-4 h-4" />}>GOTM</TabButton>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto max-w-3xl px-6 space-y-6 animate-fade-in-up">

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
                                <Card className={`border-primary/30 bg-surface/50 backdrop-blur-md overflow-hidden relative group ${game?.title?.toLowerCase() === 'pac-man' || game?.title?.toLowerCase() === 'pacman' ? 'cursor-pointer hover:border-primary/80 transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]' : ''}`}
                                    onClick={() => {
                                        if (game?.title?.toLowerCase() === 'pac-man' || game?.title?.toLowerCase() === 'pacman') {
                                            router.push('/arcade');
                                        }
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardDescription className="text-primary font-bold tracking-widest uppercase text-xs">
                                                {isSessionActive ? "Current Challenge" : (isSessionUpcoming ? "Upcoming Challenge" : "Previous Challenge")}
                                                {(game?.title?.toLowerCase() === 'pac-man' || game?.title?.toLowerCase() === 'pacman') && (
                                                    <span className="ml-2 text-yellow-400 animate-pulse bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20 text-[10px]">Tap to Play!</span>
                                                )}
                                            </CardDescription>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowHowTo(true);
                                                }}
                                                className="md:hidden w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors relative z-10"
                                            >
                                                <Info className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-3xl md:text-4xl font-black text-white italic">{game?.title || "No Active Game"}</CardTitle>
                                            <Gamepad2 className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
                                        </div>
                                    </CardHeader>
                                    <CardContent onClick={(e) => e.stopPropagation()}>
                                        <div
                                            className="aspect-video bg-black/50 rounded-lg mb-4 border border-white/10 flex items-center justify-center text-muted-foreground relative overflow-hidden cursor-pointer group-hover:border-primary/50 transition-colors"
                                            onClick={() => {
                                                if (game?.title?.toLowerCase() === 'pac-man' || game?.title?.toLowerCase() === 'pacman') {
                                                    router.push('/arcade');
                                                }
                                            }}
                                        >
                                            {game?.cover_image_url || (game?.title && game?.platform) ? (
                                                <>
                                                    <Image
                                                        src={game.cover_image_url || getLibretroBoxartUrl(game.title, game.platform)}
                                                        alt={game.title}
                                                        fill
                                                        className={`object-cover transition-all duration-500 ${game?.title?.toLowerCase() === 'pac-man' || game?.title?.toLowerCase() === 'pacman' ? 'opacity-60 group-hover:opacity-80 group-hover:scale-105' : 'opacity-60 group-hover:opacity-100'}`}
                                                        onError={(e: any) => {
                                                            e.target.srcset = PLACEHOLDER_BOXART_URL;
                                                            e.target.src = PLACEHOLDER_BOXART_URL;
                                                        }}
                                                    />
                                                    {(game?.title?.toLowerCase() === 'pac-man' || game?.title?.toLowerCase() === 'pacman') && (
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                            <div className="bg-primary text-black font-black italic uppercase tracking-widest py-3 px-6 rounded-full transform scale-90 group-hover:scale-100 transition-transform shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]">
                                                                Play in Arcade →
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
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
                                                        <Timer className="w-3 h-3" /> {isSessionUpcoming ? "Starts In" : "Time Remaining"}
                                                    </h4>
                                                    <CountdownTimer targetDate={isSessionUpcoming ? selectedSession.startDate : selectedSession.endDate} />
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
                                            ) : isSessionUpcoming ? (
                                                <div className="bg-primary/5 p-4 rounded-xl text-center border border-primary/20">
                                                    <p className="text-xs text-primary uppercase tracking-wider font-bold">Challenge Starts Soon</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">Get ready, the battle is about to begin!</p>
                                                </div>
                                            ) : (
                                                <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Challenge Has Ended</p>
                                                    {(selectedSession?.winnerName || club?.latestWinnerName) && (
                                                        <p className="text-sm text-yellow-500 font-bold mt-2">
                                                            Winner: {selectedSession?.winnerName || club?.latestWinnerName} 🏆
                                                        </p>
                                                    )}
                                                </div>
                                            )
                                        ) : !isMember ? (
                                            <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Join this club to submit scores</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-muted-foreground italic">The admin hasn't set the next challenge game yet.</div>
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
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-muted-foreground font-bold">{weekScores.length} In The Hunt</span>
                                                    {isSessionActive && (
                                                        <span className="text-[9px] text-primary/70 font-black uppercase tracking-tighter animate-pulse">
                                                            Scores Hidden Until End
                                                        </span>
                                                    )}
                                                </div>
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
                                                                    uid={member?.userId || score.userId}
                                                                    photoURL={member?.photoURL || score.photoURL}
                                                                    displayName={displayName}
                                                                    xp={member?.xp || score.xp || 0}
                                                                    size="md"
                                                                    isWinner={i === 0 && weekScores.length > 0 && score.scoreValue !== null}
                                                                    className="cursor-pointer hover:scale-110 transition-transform active:scale-95"
                                                                    onClick={() => setSelectedUser(member || {
                                                                        userId: score.userId,
                                                                        displayName,
                                                                        photoURL: score.photoURL,
                                                                        xp: score.xp,
                                                                        joinedAt: member?.joinedAt
                                                                    })}
                                                                />
                                                                <div>
                                                                    <div className="text-sm font-black text-white">{displayName}</div>
                                                                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Level {getXpLevel(member?.xp || score.xp || 0)}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`font-mono font-black text-lg ${i === 0 && score.scoreValue !== null ? 'text-yellow-500' : 'text-primary'}`}>
                                                                    {score.status === 'none' ? (
                                                                        <span className="text-[10px] italic opacity-30 tracking-widest uppercase">No Entry</span>
                                                                    ) : score.status === 'pending_verification' && score.verifiedScoreValue === undefined ? (
                                                                        <span className="text-[10px] italic text-yellow-500 font-bold uppercase tracking-tighter">Audit Pending</span>
                                                                    ) : isSessionActive && score.userId !== user?.uid ? (
                                                                        <span className="text-[10px] italic opacity-30 tracking-widest uppercase">Hidden</span>
                                                                    ) : (
                                                                        formatScore(score.scoreValue, selectedSession?.challengeType)
                                                                    )}
                                                                </div>
                                                                <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                                    {score.status === 'none' ? 'Awaiting Entry' :
                                                                        score.status === 'pending_verification' && score.verifiedScoreValue === undefined ? 'Reviewing' :
                                                                            (score.submittedAt ? new Date(score.submittedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now')}
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
                            </div>

                            {/* Sidebar Column: Rules (Desktop Only) */}
                            <div className="hidden md:block space-y-6">
                                <HowToWin />
                            </div>
                        </div>

                        {/* Chat Section in Overview */}
                        {club.chatEnabled !== false && (
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
                                                    uid={msg.userId}
                                                    photoURL={msg.photoURL}
                                                    displayName={msg.displayName}
                                                    xp={msg.xp || 0}
                                                    size="sm"
                                                    showLevel={false}
                                                    isWinner={club?.latestWinnerId === msg.userId || (club?.latestWinnerName && club?.latestWinnerName === msg.displayName)}
                                                    className="hover:scale-110 transition-transform active:scale-95"
                                                    onClick={() => {
                                                        const member = members.find(m => m.userId === msg.userId);
                                                        setSelectedUser(member || {
                                                            userId: msg.userId,
                                                            displayName: msg.displayName,
                                                            photoURL: msg.photoURL,
                                                            joinedAt: member?.joinedAt
                                                        });
                                                    }}
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

                                {/* Chat Input */}
                                {isMember ? (
                                    <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-white/10 flex gap-2">
                                        <Input
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Type a message..."
                                            className="bg-black/50 border-white/10"
                                            maxLength={500}
                                        />
                                        <Button type="submit" disabled={isSending || !chatInput.trim()} size="icon" className="shrink-0">
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="p-4 bg-black/40 text-center text-xs text-muted-foreground italic border-t border-white/10">
                                        Join this club to participate in the conversation.
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Past Challenges History */}
                        <div className="mt-12">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-muted-foreground" /> Past Challenges
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
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
                                                                        {formatScore(score.scoreValue || score.score, session.challengeType)}
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
                                                                    uid={player.userId}
                                                                    photoURL={photoURL}
                                                                    displayName={displayName}
                                                                    xp={player.xp || 0}
                                                                    size="sm"
                                                                    className="cursor-pointer hover:scale-110 transition-transform active:scale-95"
                                                                    onClick={() => setSelectedUser(member || {
                                                                        userId: player.userId,
                                                                        displayName,
                                                                        photoURL,
                                                                        xp: player.xp,
                                                                        joinedAt: member?.joinedAt
                                                                    })}
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
                                                uid={member.userId}
                                                photoURL={member.photoURL}
                                                displayName={member.displayName}
                                                xp={member.xp || 0}
                                                size="2xl"
                                                isWinner={club?.latestWinnerId === member.userId || (club?.latestWinnerName && club?.latestWinnerName === member.displayName)}
                                                className="mb-4 cursor-pointer hover:scale-105 transition-transform active:scale-95"
                                                onClick={() => setSelectedUser(member)}
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

                {/* GOTM TAB */}
                {activeTab === "gotm" && (
                    <div className="space-y-12 animate-fade-in-up">
                        {/* Current GOTM Card */}
                        {gotm ? (
                            <div className="mb-8">
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
                                                                                            // Award XP for review
                                                                                            await addXp(user.uid, 50, "GOTM Review");
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
                        ) : (
                            <div className="text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                                <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-bold text-white mb-2">No Active Mission</h3>
                                <p className="text-sm">The admins haven't selected a Game of the Month yet.</p>
                            </div>
                        )}

                        {/* GOTM Vault */}
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-6 pb-2 border-b border-primary/20">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                        <Star className="w-5 h-5 text-purple-400" />
                                        GOTM Vault
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Hall of Fame</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {pastGOTMs.length === 0 ? (
                                    <div className="col-span-full text-center py-8 text-muted-foreground bg-white/5 rounded-xl border border-white/5 text-xs">
                                        <p>No past Games of the Month yet.</p>
                                    </div>
                                ) : (
                                    pastGOTMs.map((g) => (
                                        <div
                                            key={g.id}
                                            className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 group cursor-pointer hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                                            onClick={() => setSelectedPastGOTM(g)}
                                        >
                                            {g.coverUrl ? (
                                                <Image
                                                    src={g.coverUrl}
                                                    alt={g.title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                                    <Gamepad2 className="w-8 h-8 text-white/20" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <h4 className="text-sm font-black text-white italic leading-tight uppercase mb-1 drop-shadow-md line-clamp-2">
                                                    {g.title}
                                                </h4>
                                                <p className="text-[9px] font-bold text-purple-300 uppercase tracking-widest">
                                                    {new Date(g.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {selectedPastGOTM && (
                            <GOTMHistoryModal
                                gotm={selectedPastGOTM}
                                onClose={() => setSelectedPastGOTM(null)}
                            />
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

function TabButton({ children, active, onClick, icon, badge }: { children: React.ReactNode, active: boolean, onClick: () => void, icon?: React.ReactNode, badge?: number }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1.5 px-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest border-b-2 transition-all relative ${active ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-white hover:bg-white/5'}`}
        >
            {icon && <span className={`${active ? 'text-primary' : 'text-muted-foreground'}`}>{icon}</span>}
            <span className="hidden sm:inline">{children}</span>
            <span className="sm:hidden">{active ? children : null}</span>
            {badge !== undefined && badge > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-black text-[8px] font-black px-1 rounded-full min-w-[14px]">
                    {badge}
                </span>
            )}
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
