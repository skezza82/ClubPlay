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
    getActiveSessions, // Updated import
    updateSession,
    endSessionEarly,
    deleteScore,
    updateScore,
    getSessionScores,
    processSessionResults,
    type ClubMember
} from "@/lib/firestore-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PremiumLogo } from "@/components/PremiumLogo";
import { Users, Settings, Gamepad2, Check, X, Trophy, ShieldCheck, Loader2, AlertTriangle, Calendar, ArrowLeft, Home, Camera, Trash2, Edit, Search } from "lucide-react";
import { GameSearch } from "@/components/GameSearch";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { uploadClubLogo, uploadSessionBoxart } from "@/lib/avatar-service";
import { getLibretroBoxartUrl, PLACEHOLDER_BOXART_URL } from "@/lib/libretro-utils";
import { useRef, Suspense } from "react";

function ClubAdminContent() {
    const searchParams = useSearchParams();
    const clubId = searchParams.get('id');
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

    // Game & Score State
    const [weekScores, setWeekScores] = useState<any[]>([]);
    const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
    const [editScoreValue, setEditScoreValue] = useState<string>("");

    // Manual Game State
    const [manualGame, setManualGame] = useState({
        title: "",
        platform: "",
        rules: "",
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        challengeType: 'score' as 'score' | 'speed' | 'custom',
        customUnit: "",
        cover_image_url: ""
    });
    const [activeSessions, setActiveSessions] = useState<any[]>([]); // Array of sessions
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null); // Track which session is being edited
    const [viewingScoresSessionId, setViewingScoresSessionId] = useState<string | null>(null); // Track which session's scores are being viewed
    const [editedSession, setEditedSession] = useState({
        title: "",
        platform: "",
        rules: "",
        endDate: "",
        challengeType: 'score' as 'score' | 'speed' | 'custom',
        customUnit: "",
        cover_image_url: ""
    });
    const [boxartFile, setBoxartFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const boxartInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const router = useRouter();

    // Helper to refresh sessions
    const refreshSessions = async () => {
        const sessions = await getActiveSessions(clubId as string);
        setActiveSessions(sessions);

        // Also refresh scores for the first session if exists (or logic to handle multiple score views later)
        // For now, let's just clear specific session scores on refresh to avoid confusion, 
        // or we could fetch scores for the *editing* session if there is one.
        // Let's just default to empty until a user selects one to view/edit.
        if (sessions.length > 0) {
            const targetId = viewingScoresSessionId && sessions.find(s => s.id === viewingScoresSessionId) ? viewingScoresSessionId : sessions[0].id;
            const scores = await getSessionScores(targetId);
            setWeekScores(scores);
            setViewingScoresSessionId(targetId);
        } else {
            setWeekScores([]);
            setViewingScoresSessionId(null);
        }
    };

    const handleUpdateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSessionId) return;

        setIsUpdating(true);
        try {
            await updateSession(editingSessionId, {
                gameTitle: editedSession.title,
                platform: editedSession.platform,
                rules: editedSession.rules,
                endDate: editedSession.endDate,
                challengeType: editedSession.challengeType,
                customUnit: editedSession.customUnit,
                cover_image_url: editedSession.cover_image_url
            });
            alert("Session updated successfully! 🎮");

            await refreshSessions();
            setEditingSessionId(null);
        } catch (error) {
            console.error("Error updating session:", error);
            alert("Failed to update challenge.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleBoxartSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBoxartFile(file);
            // Use local blob for immediate preview
            setManualGame(prev => ({ ...prev, cover_image_url: URL.createObjectURL(file) }));
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
            let finalCoverUrl = manualGame.cover_image_url;

            // Upload custom boxart if selected
            if (boxartFile) {
                try {
                    finalCoverUrl = await uploadSessionBoxart(clubId as string, boxartFile);
                } catch (uploadErr) {
                    console.error("Failed to upload boxart:", uploadErr);
                    if (!confirm("Failed to upload boxart image. Continue without it?")) {
                        setIsUpdating(false);
                        return;
                    }
                }
            }

            await createManualSession(clubId as string, {
                ...manualGame,
                cover_image_url: finalCoverUrl
            });

            alert("Manual game challenge started successfully! 🎮");
            setManualGame({
                title: "",
                platform: "",
                rules: "",
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                challengeType: 'score',
                customUnit: "",
                cover_image_url: ""
            });
            setBoxartFile(null);

            await refreshSessions();
        } catch (error) {
            console.error("Error creating manual session:", error);
            alert("Failed to start challenge: " + (error as any).message); // Show limit error
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEditClick = (session: any) => {
        setEditingSessionId(session.id);
        setEditedSession({
            title: session.gameTitle || "",
            platform: session.platform || "",
            rules: session.rules || "",
            endDate: session.endDate || "",
            challengeType: session.challengeType || 'score',
            customUnit: session.customUnit || "",
            cover_image_url: session.cover_image_url || ""
        });
    };

    // Score Management Handlers
    const handleDeleteScore = async (scoreId: string) => {
        if (!confirm("Are you sure you want to delete this score? This cannot be undone.")) return;
        try {
            await deleteScore(scoreId);
            setWeekScores(weekScores.filter(s => s.id !== scoreId));
            alert("Score deleted.");
        } catch (e) {
            console.error(e);
            alert("Failed to delete score.");
        }
    };

    const handleEditScore = (score: any) => {
        setEditingScoreId(score.id);
        setEditScoreValue(score.scoreValue.toString());
    };

    const handleSaveScore = async (scoreId: string) => {
        try {
            const num = parseFloat(editScoreValue);
            if (isNaN(num)) return alert("Invalid score value");

            await updateScore(scoreId, num);
            setWeekScores(weekScores.map(s => s.id === scoreId ? { ...s, scoreValue: num } : s));
            setEditingScoreId(null);
        } catch (e) {
            console.error(e);
            alert("Failed to update score.");
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

                // 4. Fetch Active Sessions
                const sessions = await getActiveSessions(clubId as string);
                setActiveSessions(sessions);

                if (sessions.length > 0) {
                    // Fetch scores for the first session by default
                    const scores = await getSessionScores(sessions[0].id);
                    setWeekScores(scores);
                    setViewingScoresSessionId(sessions[0].id);
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
                name: clubName
            });
            alert("Club name updated! 🎮");
            setClub({ ...club, name: clubName });
        } catch (error) {
            console.error("Error updating settings:", error);
            alert("Failed to update settings.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !clubId) return;

        setIsUpdating(true);
        try {
            const uploadedUrl = await uploadClubLogo(clubId as string, file);
            setLogoUrl(uploadedUrl);

            // Auto-save to Firestore
            await updateClub(clubId as string, {
                logoUrl: uploadedUrl
            });

            setClub({ ...club, logoUrl: uploadedUrl });
            alert("Logo updated successfully! 🎮");
        } catch (error) {
            console.error("Error updating logo:", error);
            alert("Logo upload failed.");
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
                    <Link href={`/club?id=${clubId}`} className="flex-1 md:flex-none">
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
                                <div className="flex border-b border-white/5 pb-8 mb-8">
                                    <div className="flex flex-col items-center gap-4">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group relative"
                                        >
                                            {logoUrl ? (
                                                <>
                                                    <img src={logoUrl} alt="Club Logo" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Camera className="w-6 h-6 text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Logo</span>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        <div className="text-center">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Club Identity</p>
                                            <Button
                                                type="button"
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0 text-primary text-[10px] font-bold uppercase tracking-widest"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                Change Logo
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex-1 pl-8 space-y-4 pt-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Club Name</label>
                                            <Input
                                                value={clubName}
                                                onChange={(e) => setClubName(e.target.value)}
                                                className="bg-background/50 border-white/10 h-12 text-white font-bold"
                                            />
                                        </div>
                                        <Button type="submit" size="sm" className="bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest h-8 px-4" disabled={isUpdating}>
                                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                            Update Name
                                        </Button>
                                    </div>
                                </div>
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

                        {/* Create New Challenge Section - Only show if not editing and < 3 active sessions */}
                        {!editingSessionId && activeSessions.length < 3 && (
                            <Card className="border-primary/20 bg-surface/40 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-primary" />
                                        Create New Challenge
                                    </CardTitle>
                                    <CardDescription>Start a new weekly competition. You can have up to 3 active challenges.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleManualSession} className="space-y-6">
                                        <div className="space-y-2 mb-6 p-4 bg-black/20 rounded-lg border border-white/5">
                                            <label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                                <Search className="w-3 h-3" /> Auto-Fill from IGDB
                                            </label>
                                            <GameSearch
                                                onSelect={(game) => {
                                                    setManualGame(prev => ({
                                                        ...prev,
                                                        title: game.name,
                                                        platform: "Arcade", // Default, user can change
                                                        cover_image_url: game.coverUrl || ""
                                                    }));
                                                    setBoxartFile(null); // Clear custom file if game selected
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        <div className="mb-6 animate-fade-in-up">
                                            <label className="text-xs font-bold text-white uppercase tracking-widest block mb-2">Boxart Image</label>
                                            <div className="flex items-start gap-4">
                                                <div
                                                    onClick={() => boxartInputRef.current?.click()}
                                                    className="w-32 h-44 bg-black/40 rounded-lg border-2 border-dashed border-white/10 hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group transition-all"
                                                >
                                                    {manualGame.cover_image_url ? (
                                                        <>
                                                            <img src={manualGame.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <Camera className="w-8 h-8 text-white" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center p-2">
                                                            <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Upload Boxart</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2 pt-2">
                                                    <p className="text-sm text-muted-foreground">
                                                        Upload a custom boxart image or cover art for your challenge.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => boxartInputRef.current?.click()}
                                                            className="text-xs font-bold uppercase"
                                                        >
                                                            Choose File
                                                        </Button>
                                                        {manualGame.cover_image_url && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setManualGame(prev => ({ ...prev, cover_image_url: "" }));
                                                                    setBoxartFile(null);
                                                                    if (boxartInputRef.current) boxartInputRef.current.value = "";
                                                                }}
                                                                className="text-xs font-bold uppercase text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                                            >
                                                                Remove
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        ref={boxartInputRef}
                                                        onChange={handleBoxartSelect}
                                                        className="hidden"
                                                        accept="image/*"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white uppercase tracking-widest">Game Title</label>
                                                <Input
                                                    value={manualGame.title}
                                                    onChange={(e) => setManualGame({ ...manualGame, title: e.target.value })}
                                                    placeholder="e.g. Street Fighter II"
                                                    className="bg-background/50 border-white/10 text-white"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white uppercase tracking-widest">System / Platform</label>
                                                <Input
                                                    value={manualGame.platform}
                                                    onChange={(e) => setManualGame({ ...manualGame, platform: e.target.value })}
                                                    placeholder="e.g. Arcade, SNES"
                                                    className="bg-background/50 border-white/10 text-white"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white uppercase tracking-widest">Challenge Type</label>
                                                <select
                                                    value={manualGame.challengeType}
                                                    onChange={(e) => setManualGame({ ...manualGame, challengeType: e.target.value as 'score' | 'speed' | 'custom' })}
                                                    className="w-full h-10 bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                                    required
                                                >
                                                    <option value="score">Points (High Score)</option>
                                                    <option value="speed">Speed (Fastest Time)</option>
                                                    <option value="custom">Custom (e.g. Kills)</option>
                                                </select>
                                            </div>
                                            {manualGame.challengeType === 'custom' && (
                                                <div className="space-y-2 animate-fade-in-up md:col-span-3">
                                                    <label className="text-xs font-bold text-primary uppercase tracking-widest">Unit / Label</label>
                                                    <Input
                                                        value={manualGame.customUnit}
                                                        onChange={(e) => setManualGame({ ...manualGame, customUnit: e.target.value })}
                                                        placeholder="e.g. Kills, Laps, Wins"
                                                        className="bg-background/50 border-white/10 text-white"
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white uppercase tracking-widest">Rules / Requirements</label>
                                            <textarea
                                                value={manualGame.rules}
                                                onChange={(e) => setManualGame({ ...manualGame, rules: e.target.value })}
                                                placeholder="e.g. Default settings, 1 credit only"
                                                className="w-full h-24 bg-background/50 border border-white/10 rounded-lg p-4 font-sans text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-xs font-bold text-white uppercase tracking-widest">Date Ends</label>
                                                <Input
                                                    type="datetime-local"
                                                    value={manualGame.endDate}
                                                    onChange={(e) => setManualGame({ ...manualGame, endDate: e.target.value })}
                                                    className="bg-background/50 border-white/10 text-white"
                                                    required
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button type="submit" className="neon-border h-12 font-black uppercase tracking-widest px-8 w-full sm:w-auto" disabled={isUpdating}>
                                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Gamepad2 className="w-5 h-5 mr-2" />}
                                                    Start Competition
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Editing Form */}
                        {editingSessionId && (
                            <Card className="border-primary/20 bg-surface/40 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">Edit Challenge</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleUpdateSession} className="space-y-6">
                                        <div className="space-y-2 mb-6 p-4 bg-black/20 rounded-lg border border-white/5">
                                            <label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                                <Search className="w-3 h-3" /> Auto-Fill from IGDB
                                            </label>
                                            <GameSearch
                                                onSelect={(game) => {
                                                    setEditedSession(prev => ({
                                                        ...prev,
                                                        title: game.name,
                                                        cover_image_url: game.coverUrl || ""
                                                    }));
                                                }}
                                                className="w-full"
                                            />
                                        </div>

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
                                                    onChange={(e) => setEditedSession({ ...editedSession, challengeType: e.target.value as 'score' | 'speed' | 'custom' })}
                                                    className="w-full h-10 bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                                    required
                                                >
                                                    <option value="score">Points (High Score)</option>
                                                    <option value="speed">Speed (Fastest Time)</option>
                                                    <option value="custom">Custom (e.g. Kills)</option>
                                                </select>
                                            </div>
                                            {editedSession.challengeType === 'custom' && (
                                                <div className="space-y-2 animate-fade-in-up">
                                                    <label className="text-xs font-bold text-primary uppercase tracking-widest">Unit / Label</label>
                                                    <Input
                                                        value={editedSession.customUnit}
                                                        onChange={(e) => setEditedSession({ ...editedSession, customUnit: e.target.value })}
                                                        placeholder="e.g. Kills, Laps, Wins"
                                                        className="bg-background/50 border-white/10 text-white"
                                                        required
                                                    />
                                                </div>
                                            )}
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
                                            <Button type="button" variant="ghost" onClick={() => setEditingSessionId(null)} className="h-12 text-muted-foreground uppercase tracking-widest font-bold">
                                                Cancel
                                            </Button>
                                        </div>

                                        {/* Live Preview of Boxart */}
                                        {editedSession.title && editedSession.platform && (
                                            <div className="mt-8 pt-8 border-t border-white/5">
                                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Boxart Preview (via Libretro)</h4>
                                                <div className="aspect-video w-full max-w-sm bg-black/50 rounded-lg border border-white/10 relative overflow-hidden flex items-center justify-center">
                                                    <Image
                                                        src={getLibretroBoxartUrl(editedSession.title, editedSession.platform)}
                                                        alt="Preview"
                                                        fill
                                                        className="object-cover"
                                                        onError={(e: any) => { e.target.style.display = 'none'; }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                                        <Gamepad2 className="w-12 h-12" />
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex gap-4 items-end">
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-xs font-bold text-white uppercase tracking-widest">Manual Boxart URL</label>
                                                        <Input
                                                            value={editedSession.cover_image_url}
                                                            onChange={(e) => setEditedSession({ ...editedSession, cover_image_url: e.target.value })}
                                                            placeholder="https://..."
                                                            className="bg-background/50 border-white/10"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Active Sessions List */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Gamepad2 className="w-5 h-5 text-primary" /> Active Challenges ({activeSessions.length}/3)
                            </h3>

                            {activeSessions.length === 0 ? (
                                <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-muted-foreground">
                                    No active challenges. Create one above!
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {activeSessions.map((session) => (
                                        <Card key={session.id} className="border-white/5 bg-surface/30">
                                            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                                                {/* Boxart */}
                                                <div className="w-24 h-16 relative bg-black/50 rounded overflow-hidden flex-shrink-0">
                                                    {session.cover_image_url ? (
                                                        <img src={session.cover_image_url} alt={session.gameTitle} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Gamepad2 className="w-8 h-8 text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white text-lg">{session.gameTitle}</h4>
                                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1"><Gamepad2 className="w-3 h-3" /> {session.platform}</span>
                                                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {session.challengeType.toUpperCase()}</span>
                                                        <span className="flex items-center gap-1 text-primary"><Calendar className="w-3 h-3" /> Ends: {new Date(session.endDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant={viewingScoresSessionId === session.id ? "secondary" : "ghost"}
                                                        className="border-white/10"
                                                        onClick={async () => {
                                                            setViewingScoresSessionId(session.id);
                                                            const scores = await getSessionScores(session.id);
                                                            setWeekScores(scores);
                                                        }}
                                                    >
                                                        <Trophy className="w-4 h-4 mr-1" /> Scores
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-primary/20 hover:bg-primary/10 text-primary"
                                                        onClick={() => handleEditClick(session)}
                                                        disabled={!!editingSessionId}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                                                        onClick={async () => {
                                                            if (window.confirm(`End "${session.gameTitle}" early? Points will be processed immediately.`)) {
                                                                try {
                                                                    await endSessionEarly(session.id);
                                                                    try {
                                                                        const processedCount = await processSessionResults(session.id, clubId as string);
                                                                        alert(`Challenge ended! Processed ${processedCount} scores.`);
                                                                    } catch (procError) {
                                                                        alert(`Ended, but processing failed: ${(procError as any).message}`);
                                                                    }
                                                                    await refreshSessions();
                                                                } catch (e) {
                                                                    console.error(e);
                                                                    alert("Failed to end session.");
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        Finish
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Scoreboard Management */}
                        {viewingScoresSessionId && activeSessions.find(s => s.id === viewingScoresSessionId) && (
                            <Card className="border-blue-500/20 bg-surface/40 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-blue-400" />
                                        Scoreboard: {activeSessions.find(s => s.id === viewingScoresSessionId)?.gameTitle}
                                    </CardTitle>
                                    <CardDescription>Edit or remove invalid scores from the leaderboard.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {(weekScores || []).length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground italic border border-dashed border-white/10 rounded-lg">
                                            No scores submitted yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {weekScores.map((score, index) => (
                                                <div key={score.id} className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 gap-4">
                                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                                        <div className="font-mono text-muted-foreground w-6">#{index + 1}</div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                                                                {score.photoURL ? (
                                                                    <Image src={score.photoURL} alt={score.displayName} width={32} height={32} className="object-cover w-full h-full" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                                                                        {score.displayName?.[0]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="font-bold text-white max-w-[120px] truncate">{score.displayName}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                                                        {editingScoreId === score.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    value={editScoreValue}
                                                                    onChange={(e) => setEditScoreValue(e.target.value)}
                                                                    className="w-24 h-9 bg-black/50 border-white/20 text-right font-mono"
                                                                    type="number"
                                                                    step="any"
                                                                    autoFocus
                                                                />
                                                                <Button size="sm" className="h-9 w-9 p-0 bg-green-500/20 text-green-400 hover:bg-green-500/30" onClick={() => handleSaveScore(score.id)}>
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-muted-foreground hover:text-white" onClick={() => setEditingScoreId(null)}>
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="font-mono font-bold text-primary text-lg mr-4">
                                                                    {activeSessions.find(s => s.id === viewingScoresSessionId)?.challengeType === 'speed' ? `${score.scoreValue}s` : score.scoreValue.toLocaleString()}
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-400" onClick={() => handleEditScore(score)}>
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400" onClick={() => handleDeleteScore(score.id)}>
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
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

export default function ClubAdminPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <ClubAdminContent />
        </Suspense>
    );
}
