"use client";

import { useEffect, useState } from "react";
import {
    getClub,
    getClubMembers,
    getJoinRequests,
    respondToJoinRequest,
    updateClub,
    disbandClub,
    updateMemberRole,
    createManualSession,
    getActiveSession,
    updateSession,
    type ClubMember
} from "@/lib/firestore-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PremiumLogo } from "@/components/PremiumLogo";
import { Users, Settings, Gamepad2, Check, X, Trophy, ShieldCheck, Loader2, AlertTriangle, Calendar, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
export default function ClubAdminPage() {
    const { id: clubId } = useParams();
    const [club, setClub] = useState<any>(null);
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"requests" | "game" | "members" | "settings">("requests");
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Settings State
    const [clubName, setClubName] = useState("");
    const [logoUrl, setLogoUrl] = useState("");

    // Manual Game State
    const [manualGame, setManualGame] = useState({
        title: "",
        platform: "",
        rules: "",
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        challengeType: 'score' as 'score' | 'speed'
    });
    const [activeSession, setActiveSession] = useState<any>(null);
    const [isEditingSession, setIsEditingSession] = useState(false);
    const [editedSession, setEditedSession] = useState({
        title: "",
        platform: "",
        rules: "",
        endDate: "",
        challengeType: 'score' as 'score' | 'speed'
    });

    const { user } = useAuth();
    const router = useRouter();

    const handleUpdateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSession) return;

        setIsUpdating(true);
        try {
            await updateSession(activeSession.id, {
                gameTitle: editedSession.title,
                platform: editedSession.platform,
                rules: editedSession.rules,
                endDate: editedSession.endDate,
                challengeType: editedSession.challengeType
            });
            alert("Session updated successfully! 🎮");
            setActiveSession({
                ...activeSession,
                gameTitle: editedSession.title,
                platform: editedSession.platform,
                rules: editedSession.rules,
                endDate: editedSession.endDate,
                challengeType: editedSession.challengeType
            });
            setIsEditingSession(false);
        } catch (error) {
            console.error("Error updating session:", error);
            alert("Failed to update challenge.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleManualSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualGame.title || !manualGame.platform) {
            alert("Title and Platform are required.");
            return;
        }

        setIsUpdating(true);
        try {
            await createManualSession(clubId as string, manualGame);
            alert("Manual game challenge started successfully! 🎮");
            setManualGame({
                title: "",
                platform: "",
                rules: "",
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                challengeType: 'score'
            });

            // Refresh active session
            const session = await getActiveSession(clubId as string);
            if (session) {
                setActiveSession(session);
                setEditedSession({
                    title: session.gameTitle || "",
                    platform: session.platform || "",
                    rules: session.rules || "",
                    endDate: session.endDate || "",
                    challengeType: session.challengeType || 'score'
                });
            }
        } catch (error) {
            console.error("Error creating manual session:", error);
            alert("Failed to start manual challenge.");
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        const fetchAdminData = async () => {
            if (!user || !clubId) return;

            try {
                // 1. Fetch Club Details
                const clubData = await getClub(clubId as string);
                if (!clubData) {
                    alert("Club not found!");
                    router.push("/clubs");
                    return;
                }

                // 3. Fetch Members
                const memData = await getClubMembers(clubId as string) as ClubMember[];
                setMembers(memData);

                // Verify Access (Owner or Admin)
                const currentUserMembership = memData.find(m => m.userId === user.uid);
                if (!currentUserMembership || (currentUserMembership.role !== 'owner' && currentUserMembership.role !== 'admin')) {
                    alert("Access Denied: You do not have permission to manage this club.");
                    router.push("/clubs");
                    return;
                }
                setUserRole(currentUserMembership.role);

                setClub(clubData);
                setClubName(clubData.name);
                setLogoUrl(clubData.logoUrl || "");

                // 2. Fetch Requests
                const reqData = await getJoinRequests(clubId as string);
                setRequests(reqData);

                // 3. (Already fetched members above to verify role)

                // 4. Fetch Active Session
                const session = await getActiveSession(clubId as string);
                if (session) {
                    setActiveSession(session);
                    setEditedSession({
                        title: session.gameTitle || "",
                        platform: session.platform || "",
                        rules: session.rules || "",
                        endDate: session.endDate || "",
                        challengeType: session.challengeType || 'score'
                    });
                }

            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAdminData();
    }, [clubId, user, router]);

    const handleRequestAction = async (requestId: string, userId: string, action: 'accepted' | 'rejected') => {
        try {
            await respondToJoinRequest(requestId, clubId as string, userId, action);

            // Optimistic update
            setRequests(requests.filter(r => r.id !== requestId));

            if (action === 'accepted') {
                // Determine user details from request (if available) or wait for re-fetch
                // For now, let's just trigger a re-fetch of members to be safe
                const memData = await getClubMembers(clubId as string);
                setMembers(memData);
                alert("Request Accepted!");
            }
        } catch (error) {
            console.error("Error handling request:", error);
            alert("Failed to process request.");
        }
    };

    const handleToggleAdmin = async (userId: string, currentRole: string) => {
        if (userRole !== 'owner') return;

        const newRole = currentRole === 'admin' ? 'member' : 'admin';
        const actionLabel = newRole === 'admin' ? 'Promote to Admin' : 'Demote to Member';

        if (!confirm(`Are you sure you want to ${actionLabel}?`)) return;

        setIsUpdating(true);
        try {
            await updateMemberRole(clubId as string, userId, newRole);
            alert(`User successfully ${newRole === 'admin' ? 'promoted' : 'demoted'}.`);

            // Refresh members list
            const memData = await getClubMembers(clubId as string);
            setMembers(memData);
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update user role.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await updateClub(clubId as string, {
                name: clubName,
                logoUrl: logoUrl
            });
            alert("Club settings updated!");
            setClub({ ...club, name: clubName, logoUrl: logoUrl });
        } catch (error) {
            console.error("Error updating settings:", error);
            alert("Failed to update settings.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDisband = async () => {
        if (!confirm("ARE YOU SURE? This will permanently delete the club and remove all members. This action cannot be undone.")) return;

        const confirmName = prompt(`Type "${club.name}" to confirm disbanding:`);
        if (confirmName !== club.name) {
            alert("Club name did not match. Disband cancelled.");
            return;
        }

        setIsUpdating(true);
        try {
            await disbandClub(clubId as string);
            alert("Club disbanded successfully.");
            router.push("/profile");
        } catch (error) {
            console.error("Error disbanding club:", error);
            alert("Failed to disband club: " + (error as any).message);
            setIsUpdating(false);
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
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                        Admin <span className="text-primary text-glow">Dashboard</span>
                    </h2>
                    <div className="flex items-center gap-3 text-sm">
                        <p className="text-muted-foreground font-bold uppercase tracking-widest">{club?.name}</p>
                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                        <p className="text-primary/70 font-bold uppercase text-[10px] tracking-widest flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            EST. {club?.createdAt ? new Date(club.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2024'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <Link href={`/clubs/${clubId}`} className="flex-1 md:flex-none">
                        <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5 text-xs font-black uppercase tracking-widest h-12 px-8 neon-border-static">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Club
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6">
                <div className="flex bg-surface/50 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full">
                    <TabButton active={activeTab === "requests"} onClick={() => setActiveTab("requests")}>Requests</TabButton>
                    <TabButton active={activeTab === "members"} onClick={() => setActiveTab("members")}>Members</TabButton>
                    <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>Settings</TabButton>
                    <TabButton active={activeTab === "game"} onClick={() => setActiveTab("game")}>Game</TabButton>
                </div>
            </div>

            {activeTab === "requests" && (
                <div className="grid gap-6 animate-fade-in-up">
                    <Card className="border-primary/20 bg-surface/40 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Pending Join Requests
                            </CardTitle>
                            <CardDescription>Approve or deny new members wanting to join your club.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {requests.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                                    No pending requests at the moment.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map((req) => (
                                        <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-background/50 border border-white/5 gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                                    {req.photoURL ? (
                                                        <Image src={req.photoURL} alt={req.displayName} width={40} height={40} />
                                                    ) : (
                                                        <Users className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{req.displayName}</p>
                                                    <p className="text-xs text-muted-foreground">Requested {new Date(req.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <Button size="sm" variant="default" className="flex-1 sm:flex-none bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/40" onClick={() => handleRequestAction(req.id, req.userId, 'accepted')}>
                                                    <Check className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                                <Button size="sm" variant="ghost" className="flex-1 sm:flex-none text-red-400 hover:bg-red-500/10" onClick={() => handleRequestAction(req.id, req.userId, 'rejected')}>
                                                    <X className="w-4 h-4 mr-1" /> Deny
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )
            }

            {
                activeTab === "members" && (
                    <Card className="border-blue-500/20 bg-surface/40 backdrop-blur-md animate-fade-in-up">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                                Member Management
                            </CardTitle>
                            <CardDescription>View and manage your club roster.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-400">
                                                {member.displayName?.[0] || "M"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white flex items-center gap-2">
                                                    {member.displayName}
                                                    {member.role === 'owner' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/30">OWNER</span>}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {userRole === 'owner' && member.userId !== user?.uid && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className={`text-xs font-bold uppercase tracking-widest ${member.role === 'admin' ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
                                                    onClick={() => handleToggleAdmin(member.userId, member.role)}
                                                >
                                                    {member.role === 'admin' ? 'Demote' : 'Make Admin'}
                                                </Button>
                                            )}
                                            {member.role !== 'owner' && (
                                                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-400">
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {
                activeTab === "settings" && (
                    <Card className="border-white/10 bg-surface/40 backdrop-blur-md animate-fade-in-up">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-white" />
                                Club Settings
                            </CardTitle>
                            <CardDescription>Update your club's identity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateSettings} className="space-y-6 max-w-lg">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white uppercase tracking-wider">Club Name</label>
                                    <Input
                                        value={clubName}
                                        onChange={(e) => setClubName(e.target.value)}
                                        className="bg-background/50 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white uppercase tracking-wider">Logo URL</label>
                                    <Input
                                        value={logoUrl}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="bg-background/50 border-white/10 font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">Paste a direct link to an image for now.</p>
                                </div>
                                <Button type="submit" className="neon-border w-full" disabled={isUpdating}>
                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save Changes
                                </Button>
                            </form>

                            {userRole === 'owner' && (
                                <div className="mt-12 pt-12 border-t border-red-500/20">
                                    <h3 className="text-red-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> Danger Zone
                                    </h3>
                                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div>
                                            <h4 className="text-white font-bold">Disband Club</h4>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                Permanently delete this club and remove all members. This action cannot be undone.
                                            </p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDisband}
                                            className="whitespace-nowrap bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                                        >
                                            Disband Club
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            }

            {
                activeTab === "game" && (
                    <div className="space-y-8 animate-fade-in-up">
                        {activeSession && (
                            <Card className="border-primary/20 bg-surface/40 backdrop-blur-md">
                                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-primary" />
                                            Current Active Challenge
                                        </CardTitle>
                                        <CardDescription>Details for the ongoing weekly competition.</CardDescription>
                                    </div>
                                    {!isEditingSession && (
                                        <Button variant="outline" onClick={() => setIsEditingSession(true)} className="w-full md:w-auto border-primary/20 text-xs font-bold uppercase tracking-widest px-6 h-10 neon-border-static">
                                            Edit Challenge
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {isEditingSession ? (
                                        <form onSubmit={handleUpdateSession} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-white uppercase tracking-widest">Game Title</label>
                                                    <Input
                                                        value={editedSession.title}
                                                        onChange={(e) => setEditedSession({ ...editedSession, title: e.target.value })}
                                                        className="bg-background/50 border-white/10"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-white uppercase tracking-widest">System / Platform</label>
                                                    <Input
                                                        value={editedSession.platform}
                                                        onChange={(e) => setEditedSession({ ...editedSession, platform: e.target.value })}
                                                        className="bg-background/50 border-white/10"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-white uppercase tracking-widest">Challenge Type</label>
                                                    <select
                                                        value={editedSession.challengeType}
                                                        onChange={(e) => setEditedSession({ ...editedSession, challengeType: e.target.value as 'score' | 'speed' })}
                                                        className="w-full h-10 bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                                        required
                                                    >
                                                        <option value="score">Points (High Score)</option>
                                                        <option value="speed">Speed (Fastest Time)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white uppercase tracking-widest">Challenge Requirements / Rules</label>
                                                <textarea
                                                    value={editedSession.rules}
                                                    onChange={(e) => setEditedSession({ ...editedSession, rules: e.target.value })}
                                                    className="w-full h-32 bg-background/50 border border-white/10 rounded-lg p-4 font-sans text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2 max-w-sm">
                                                <label className="text-xs font-bold text-white uppercase tracking-widest">Challenge Finish Date & Time</label>
                                                <Input
                                                    type="datetime-local"
                                                    value={editedSession.endDate}
                                                    onChange={(e) => setEditedSession({ ...editedSession, endDate: e.target.value })}
                                                    className="bg-background/50 border-white/10 text-white"
                                                    required
                                                />
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <Button type="submit" className="neon-border h-12 font-black uppercase tracking-widest px-8" disabled={isUpdating}>
                                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                                    Save Changes
                                                </Button>
                                                <Button type="button" variant="ghost" onClick={() => setIsEditingSession(false)} className="h-12 text-muted-foreground uppercase tracking-widest font-bold">
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Active Game</h4>
                                                    <p className="text-3xl font-black text-white italic uppercase tracking-tighter">{activeSession.gameTitle}</p>
                                                </div>
                                                <div className="flex gap-8">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Platform</h4>
                                                        <p className="text-white font-bold">{activeSession.platform}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Mode</h4>
                                                        <p className="text-primary font-bold uppercase">{activeSession.challengeType === 'speed' ? 'Speed Trial' : 'High Score'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Ends At</h4>
                                                    <p className="text-white font-bold flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-primary" />
                                                        {new Date(activeSession.endDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Rules</h4>
                                                    <div className="text-sm text-white/80 leading-relaxed italic p-4 bg-white/5 border border-white/10 rounded-xl whitespace-pre-wrap">
                                                        {activeSession.rules}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-purple-500/20 bg-surface/40 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gamepad2 className="w-5 h-5 text-purple-400" />
                                    {activeSession ? "Start New Season Challenge" : "Add Game Manually"}
                                </CardTitle>
                                <CardDescription>Setup a custom challenge for your club members.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleManualSession} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white uppercase tracking-widest">Game Title</label>
                                            <Input
                                                placeholder="e.g., Halo Infinite"
                                                value={manualGame.title}
                                                onChange={(e) => setManualGame({ ...manualGame, title: e.target.value })}
                                                className="bg-background/50 border-white/10"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white uppercase tracking-widest">System / Platform</label>
                                            <Input
                                                placeholder="e.g., Xbox Series X"
                                                value={manualGame.platform}
                                                onChange={(e) => setManualGame({ ...manualGame, platform: e.target.value })}
                                                className="bg-background/50 border-white/10"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white uppercase tracking-widest">Challenge Type</label>
                                            <select
                                                value={manualGame.challengeType}
                                                onChange={(e) => setManualGame({ ...manualGame, challengeType: e.target.value as 'score' | 'speed' })}
                                                className="w-full h-10 bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="score">Points (High Score)</option>
                                                <option value="speed">Speed (Fastest Time)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white uppercase tracking-widest">Challenge Requirements / Rules</label>
                                        <textarea
                                            placeholder="e.g., Play Ranked Slayer. Highest K/D wins. Screenshots of the post-game carnage required."
                                            value={manualGame.rules}
                                            onChange={(e) => setManualGame({ ...manualGame, rules: e.target.value })}
                                            className="w-full h-32 bg-background/50 border border-white/10 rounded-lg p-4 font-sans text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2 max-w-sm">
                                        <label className="text-xs font-bold text-white uppercase tracking-widest">Challenge Finish Date & Time</label>
                                        <Input
                                            type="datetime-local"
                                            value={manualGame.endDate}
                                            onChange={(e) => setManualGame({ ...manualGame, endDate: e.target.value })}
                                            className="bg-background/50 border-white/10 text-white"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full md:w-auto px-12 neon-border h-12 italic font-black uppercase tracking-widest"
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                        Start Manual Challenge
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="text-sm text-muted-foreground bg-white/5 p-4 rounded-lg italic border border-white/5">
                            <AlertTriangle className="w-4 h-4 inline mr-2 text-yellow-500" />
                            Warning: Starting a new manual challenge will deactivate the current one and clear the weekly leaderboard for this club.
                        </div>
                    </div>
                )
            }
        </main >
    );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 whitespace-nowrap ${active ? 'bg-primary text-black shadow-[0_0_15px_rgba(102,252,241,0.5)]' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
        >
            {children}
        </button>
    );
}
