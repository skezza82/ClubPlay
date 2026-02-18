"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getFriends,
    getFriendRequests,
    respondToFriendRequest,
    UserPublicProfile,
    FriendRequest,
    getXpLevel
} from "@/lib/firestore-service";
import {
    Users,
    UserPlus,
    UserCheck,
    UserX,
    Loader2,
    Trophy,
    MessageSquare,
    ArrowRight,
    UserCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/UserAvatar";

export default function FriendsPage() {
    const { user } = useAuth();
    const [friends, setFriends] = useState<UserPublicProfile[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [friendsList, requestsList] = await Promise.all([
                getFriends(user.uid),
                getFriendRequests(user.uid)
            ]);
            setFriends(friendsList as UserPublicProfile[]);
            setRequests(requestsList);
        } catch (error) {
            console.error("Error fetching friends data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
        if (!user) return;
        setActionLoading(requestId);
        try {
            await respondToFriendRequest(requestId, status);
            // Refresh data
            await fetchData();
        } catch (error) {
            console.error(`Error ${status} request:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto space-y-12 animate-fade-in-up pb-32">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase flex items-center gap-4">
                    <Users className="w-10 h-10 text-primary" />
                    Gamer Network
                </h1>
                <p className="text-muted-foreground ml-1 text-lg">Manage your connections and pending alliances.</p>
            </div>

            {/* Pending Requests Section */}
            {requests.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-yellow-500/50 to-transparent" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-yellow-500 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Pending Requests ({requests.length})
                        </h2>
                        <div className="h-[2px] flex-1 bg-gradient-to-l from-yellow-500/50 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {requests.map((req) => (
                            <div key={req.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between group border-yellow-500/20 bg-yellow-500/5">
                                <div className="flex items-center gap-4">
                                    <UserAvatar
                                        photoURL={req.senderPhoto}
                                        displayName={req.senderName}
                                        xp={req.senderXp || 0}
                                        size="md"
                                        className="rounded-xl"
                                    />
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{req.senderName}</h3>
                                        <p className="text-[10px] text-yellow-500/70 uppercase font-bold tracking-widest">Wants to connect</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleResponse(req.id, 'accepted')}
                                        disabled={actionLoading === req.id}
                                        className="p-3 bg-green-500 text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
                                    >
                                        <UserCheck className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleResponse(req.id, 'rejected')}
                                        disabled={actionLoading === req.id}
                                        className="p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        <UserX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Friends Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                        My Allies ({friends.length})
                    </h2>
                    <div className="h-[2px] flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
                </div>

                {friends.length === 0 ? (
                    <div className="text-center py-20 glass-panel rounded-3xl border-dashed opacity-50 space-y-4">
                        <Users className="w-16 h-16 mx-auto text-muted-foreground/20" />
                        <div className="space-y-1">
                            <p className="font-black uppercase italic tracking-widest">No connections found</p>
                            <p className="text-xs text-muted-foreground uppercase">The arena is cold. Go find some rivals!</p>
                        </div>
                        <Link href="/search">
                            <Button variant="outline" className="mt-4 border-primary/30 text-primary">
                                Launch Discovery
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {friends.map((friend) => (
                            <div key={friend.uid} className="glass-panel p-5 rounded-2xl flex flex-col gap-4 group hover:border-primary/30 transition-all hover:scale-[1.02]">
                                <div className="flex items-start justify-between">
                                    <Link href={`/user?id=${friend.uid}`} className="flex items-center gap-4">
                                        <UserAvatar
                                            photoURL={friend.photoURL}
                                            displayName={friend.displayName}
                                            xp={friend.xp || 0}
                                            size="lg"
                                        />
                                        <div>
                                            <h3 className="font-black text-xl group-hover:text-primary transition-colors">{friend.displayName}</h3>
                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-0.5">
                                                    Level {getXpLevel(friend.xp || 0)}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                                    <Users className="w-3 h-3 text-primary" /> {friend.friendsCount || 0} Friends
                                                </p>
                                                {friend.currentChallenge && (
                                                    <p className="text-[10px] text-primary/80 uppercase tracking-widest font-black italic flex items-center gap-1.5">
                                                        <Trophy className="w-3 h-3" /> {friend.currentChallenge}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                    <Link
                                        href={`/user?id=${friend.uid}`}
                                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
