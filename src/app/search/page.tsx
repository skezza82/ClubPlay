"use client";

import { useState, useEffect } from "react";
import { searchUsers, sendFriendRequest, searchClubs, requestJoin } from "@/lib/firestore-service";
import { useAuth } from "@/context/AuthContext";
import { Search, UserPlus, Check, Users, ArrowRight, X, Trophy, Compass, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/UserAvatar";

export default function SearchPage() {
    const { user: currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [userResults, setUserResults] = useState<any[]>([]);
    const [clubResults, setClubResults] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"players" | "clubs">("players");
    const [loading, setLoading] = useState(false);
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
    const [sentJoinRequests, setSentJoinRequests] = useState<Set<string>>(new Set());

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 2) {
                handleSearch();
            } else {
                setUserResults([]);
                setClubResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const [users, clubs] = await Promise.all([
                searchUsers(searchTerm),
                searchClubs(searchTerm)
            ]);

            // Filter out current user from player results
            setUserResults(users.filter(u => u.uid !== currentUser?.uid));
            setClubResults(clubs);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async (userId: string, targetName: string) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            await sendFriendRequest(currentUser.uid, userId);
            setSentRequests(prev => new Set(prev).add(userId));
            alert(`Friend request sent to ${targetName}! 🎉`);
        } catch (error: any) {
            console.error("Failed to send friend request:", error);
            alert(error.message || "Failed to send request. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClub = async (clubId: string, clubName: string) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            await requestJoin(clubId, currentUser.uid, currentUser.displayName || "Gamer", currentUser.photoURL || undefined);
            setSentJoinRequests(prev => new Set(prev).add(clubId));
            alert(`Join request sent to ${clubName}! 🔥`);
        } catch (error: any) {
            console.error("Failed to join club:", error);
            alert("Failed to send request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 pb-24 md:p-8 max-w-2xl mx-auto space-y-8 animate-fade-in-up">
            <div className="space-y-2">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">Discovery</h1>
                <p className="text-sm text-muted-foreground">Search for your rivals, allies, and new legions.</p>
            </div>

            {/* Search Input */}
            <div className="relative group">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${loading ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                <input
                    type="text"
                    placeholder={activeTab === 'players' ? "Search players by nickname..." : "Search clubs by name or ID..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface border-2 border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-surface/50 rounded-xl border border-white/5">
                <button
                    onClick={() => setActiveTab("players")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "players"
                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(102,252,241,0.3)]'
                        : 'text-muted-foreground hover:text-white'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Players {userResults.length > 0 && `(${userResults.length})`}
                </button>
                <button
                    onClick={() => setActiveTab("clubs")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "clubs"
                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(102,252,241,0.3)]'
                        : 'text-muted-foreground hover:text-white'
                        }`}
                >
                    <Compass className="w-4 h-4" />
                    Clubs {clubResults.length > 0 && `(${clubResults.length})`}
                </button>
            </div>

            {/* Results */}
            <div className="space-y-4">
                {searchTerm.length >= 2 && !loading && (
                    activeTab === 'players' ? (
                        userResults.length === 0 ? (
                            <div className="text-center py-12 glass-panel rounded-3xl border-dashed">
                                <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                <p className="text-muted-foreground">No players found matching "{searchTerm}"</p>
                            </div>
                        ) : (
                            userResults.map((user) => (
                                <div
                                    key={user.uid}
                                    className="glass-panel p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30"
                                >
                                    <Link href={`/user?id=${user.uid}`} className="flex items-center gap-4 flex-1">
                                        <UserAvatar
                                            photoURL={user.photoURL}
                                            displayName={user.displayName}
                                            xp={user.xp || 0}
                                            size="md"
                                        />
                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{user.displayName}</h3>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                                    <Users className="w-3 h-3 text-primary" /> {user.friendsCount || 0} Friends
                                                </p>
                                                {user.currentChallenge && (
                                                    <p className="text-[10px] text-primary/80 uppercase tracking-widest font-black italic flex items-center gap-1.5">
                                                        <Trophy className="w-3 h-3" /> {user.currentChallenge}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleAddFriend(user.uid, user.displayName)}
                                            disabled={sentRequests.has(user.uid)}
                                            className={`p-3 rounded-xl transition-all ${sentRequests.has(user.uid)
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-white/5 hover:bg-primary hover:text-black'
                                                }`}
                                        >
                                            {sentRequests.has(user.uid) ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <UserPlus className="w-5 h-5" />
                                            )}
                                        </button>
                                        <Link
                                            href={`/user?id=${user.uid}`}
                                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        clubResults.length === 0 ? (
                            <div className="text-center py-12 glass-panel rounded-3xl border-dashed">
                                <Compass className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                <p className="text-muted-foreground">No clubs found matching "{searchTerm}"</p>
                            </div>
                        ) : (
                            clubResults.map((club) => (
                                <div
                                    key={club.id}
                                    className="glass-panel p-5 rounded-2xl flex flex-col gap-4 group hover:border-primary/30"
                                >
                                    <div className="flex items-start justify-between">
                                        <Link href={`/club?id=${club.id}`} className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-surface border border-white/5 overflow-hidden flex items-center justify-center">
                                                {club.logoUrl ? (
                                                    <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Shield className="w-8 h-8 text-primary/30" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-xl group-hover:text-primary transition-colors">{club.name}</h3>
                                                    <span className="bg-white/5 text-muted-foreground text-[8px] uppercase font-bold px-1.5 py-0.5 rounded">
                                                        #{club.inviteCode}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                    <Users className="w-3 h-3 text-primary" /> {club.memberCount || 0} Members
                                                </p>
                                            </div>
                                        </Link>
                                        <Link
                                            href={`/club?id=${club.id}`}
                                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    {club.bio && (
                                        <p className="text-sm text-gray-400 line-clamp-2 px-1">
                                            {club.bio}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                                        <Button
                                            onClick={() => handleJoinClub(club.id, club.name)}
                                            disabled={sentJoinRequests.has(club.id)}
                                            className="flex-1 neon-border font-black text-xs h-10 uppercase tracking-widest transition-all"
                                        >
                                            {sentJoinRequests.has(club.id) ? (
                                                <span className="flex items-center gap-2 text-green-400">
                                                    <Check className="w-4 h-4" /> Sent
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Join Legion <ChevronRight className="w-4 h-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )
                    )
                )}

                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-panel p-4 rounded-2xl flex items-center gap-4 animate-pulse">
                                <div className="w-12 h-12 rounded-xl bg-white/5"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-white/5 rounded w-1/3"></div>
                                    <div className="h-2 bg-white/5 rounded w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!searchTerm && !loading && (
                    <div className="text-center py-24 opacity-20">
                        <Search className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-black uppercase tracking-widest italic">Awaiting Search Term</p>
                        <p className="text-xs mt-2 uppercase tracking-tighter">Enter a nickname or club ID to begin intel gathering</p>
                    </div>
                )}
            </div>
        </div>
    );
}
