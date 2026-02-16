"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUserPublicProfile, UserPublicProfile, sendFriendRequest, checkFriendshipStatus } from "@/lib/firestore-service";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Users, Trophy, Target, Award, UserPlus, Check, ExternalLink, Heart, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

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
                        <div className="w-32 h-32 rounded-3xl bg-surface border-2 border-primary/20 p-1 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                            {profile.photoURL ? (
                                <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                    <Users className="w-12 h-12 text-primary/40" />
                                </div>
                            )}
                        </div>
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

                        {user?.uid !== id && (
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                {isFriend ? (
                                    <div className="px-6 py-3 rounded-xl font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-2 shadow-lg">
                                        <Heart className="w-5 h-5 fill-primary" /> Already Friends
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
