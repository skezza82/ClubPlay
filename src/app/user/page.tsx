"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUserPublicProfile, UserPublicProfile, sendFriendRequest, unfriend, checkFriendshipStatus, getXpLevel, getXpProgress } from "@/lib/firestore-service";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Users, Trophy, Target, Award, UserPlus, UserX, Check, ExternalLink, Heart, Loader2, AlertCircle, Shield } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import Link from "next/link";
import TrophyCabinet from "@/components/badges/TrophyCabinet";
import RetroAchievementsWidget from "@/components/badges/RetroAchievementsWidget";

function UserProfileContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserPublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [requestSent, setRequestSent] = useState(false);
    const [isFriend, setIsFriend] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            setLoading(true);
            getUserPublicProfile(id as string).then(async (p) => {
                setProfile(p);
                if (user && id !== user.uid) {
                    const status = await checkFriendshipStatus(user.uid, id as string);
                    setIsFriend(status);
                }
                setLoading(false);
            }).catch(err => {
                console.error("Error loading profile:", err);
                setError("Failed to load profile data.");
                setLoading(false);
            });
        }
    }, [id, user]);

    const handleSendRequest = async () => {
        if (!user || !id) return;
        try {
            await sendFriendRequest(user.uid, id as string);
            setRequestSent(true);
        } catch (err: any) {
            console.error("Failed to send request:", err);
            alert(err.message || "Failed to send friend request. Ensure you are signed in.");
        }
    };

    const handleUnfriend = async () => {
        if (!user || !id || !profile) return;
        if (!confirm(`Are you sure you want to unfriend ${profile.displayName}?`)) return;

        try {
            await unfriend(user.uid, id as string);
            setIsFriend(false);
        } catch (err) {
            console.error("Failed to unfriend:", err);
            alert("Failed to unfriend.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">{error || "User Not Found"}</h2>
                <p className="text-muted-foreground mb-6">This player might have moved on to other quests.</p>
                <button
                    onClick={() => router.back()}
                    className="glass-button px-6 py-2 rounded-xl flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pb-24 md:p-8 max-w-4xl mx-auto space-y-8 animate-bounce-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                >
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <h1 className="text-xl font-bold tracking-tight uppercase italic opacity-50">Player Profile</h1>
                <div className="w-10"></div>
            </div>

            {/* Profile Card */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden rgb-neon-border-subtle">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative group">
                        <UserAvatar
                            photoURL={profile.photoURL}
                            displayName={profile.displayName}
                            xp={profile.xp || 0}
                            size="2xl"
                            className="transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase">{profile.displayName}</h2>
                            <div className="flex flex-col gap-1 items-center md:items-start">
                                <p className="text-primary font-bold tracking-widest text-xs uppercase italic">Club Member</p>
                                {profile.currentChallenge && (
                                    <p className="text-[10px] text-white/50 uppercase tracking-widest font-black flex items-center gap-1.5 animate-pulse">
                                        🎮 Playing: <span className="text-primary">{profile.currentChallenge}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Level & XP */}
                        <div className="flex flex-col items-center md:items-start space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-primary text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">LVL {getXpLevel(profile.xp)}</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{profile.xp} TOTAL XP</span>
                            </div>
                            <div className="w-48 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-all duration-1000"
                                    style={{ width: `${getXpProgress(profile.xp).percentage}%` }}
                                />
                            </div>
                        </div>

                        {user?.uid !== id && (
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                {isFriend ? (
                                    <div className="flex gap-3">
                                        <div className="px-6 py-3 rounded-xl font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-2 shadow-lg">
                                            <Heart className="w-5 h-5 fill-primary" /> Already Friends
                                        </div>
                                        <button
                                            onClick={handleUnfriend}
                                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                            title="Unfriend"
                                        >
                                            <UserX className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleSendRequest}
                                        disabled={requestSent}
                                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${requestSent
                                            ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                                            : 'bg-primary text-black hover:scale-105 shadow-lg shadow-primary/20'
                                            }`}
                                    >
                                        {requestSent ? (
                                            <><Check className="w-5 h-5" /> Request Sent</>
                                        ) : (
                                            <><UserPlus className="w-5 h-5" /> Add Friend</>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:scale-105 transition-transform duration-300">
                    <div className="p-3 bg-purple-500/20 rounded-xl text-purple-500">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black">{profile.wins}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Victories</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:scale-105 transition-transform duration-300">
                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-500">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black">{profile.challengesCount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Challenges</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:scale-105 transition-transform duration-300">
                    <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black">{profile.friendsCount || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Friends</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 hidden md:flex hover:scale-105 transition-transform duration-300">
                    <div className="p-3 bg-green-500/20 rounded-xl text-green-500">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black">{profile.clubsJoined}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Clubs</p>
                    </div>
                </div>
            </div>

            {/* Trophy Cabinet */}
            <div className="pt-4 relative z-20">
                <TrophyCabinet badges={profile.badges || {}} title={`${profile.displayName}'s Trophy Cabinet`} />
            </div>

            {/* RetroAchievements */}
            {profile.raUsername && (
                <div className="pt-4 relative z-10">
                    <RetroAchievementsWidget raUsername={profile.raUsername} />
                </div>
            )}

            {/* Clubs Joined */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" /> Clubs & Memberships
                </h3>
                {profile.clubs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profile.clubs.map(club => (
                            <Link
                                key={club.id}
                                href={`/club?id=${club.id}`}
                                className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:border-primary/40 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-surface border border-white/10 flex items-center justify-center overflow-hidden">
                                    {club.logoUrl ? (
                                        <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Shield className="w-6 h-6 text-primary/40" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white group-hover:text-primary transition-colors truncate">{club.name}</h4>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{club.role}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel p-8 rounded-3xl text-center border-dashed">
                        <p className="text-muted-foreground italic">This player hasn't joined any clubs yet.</p>
                    </div>
                )}
            </div>

            {/* Main Club & Leaderboard */}
            {profile.mainClub && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                        <Award className="w-4 h-4" /> Top Performance
                    </h3>
                    <div className="glass-panel p-6 rounded-3xl border-l-[6px] border-l-primary flex items-center justify-between group">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Current Standing</p>
                            <h4 className="text-xl font-bold flex items-center gap-2">
                                {profile.mainClub.rank} / {profile.mainClub.totalMembers}
                                <span className="text-xs text-muted-foreground font-normal italic">Rank in {profile.mainClub.name}</span>
                            </h4>
                        </div>
                        <Link
                            href={`/club?id=${profile.mainClub.id}`}
                            className="p-3 bg-white/5 hover:bg-primary/20 rounded-2xl transition-all group-hover:scale-110"
                        >
                            <ExternalLink className="w-5 h-5 text-primary" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function UserProfilePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        }>
            <UserProfileContent />
        </Suspense>
    );
}
