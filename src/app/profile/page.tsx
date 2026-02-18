"use client";

import { LevelUpCelebration } from "@/components/LevelUpCelebration";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PremiumLogo } from "@/components/PremiumLogo";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Shield, Camera, ArrowLeft, CheckCircle, PlusCircle, Upload, Loader2, Users, Search, XCircle, Heart, PartyPopper, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { PRESET_AVATARS, uploadAvatar, updateUserAvatar, DEFAULT_BANNERS } from "@/lib/avatar-service";
import { getUserClubs, updateUserProfile, getFriendRequests, respondToFriendRequest, FriendRequest, hideClub, randomizeAllClubBanners, findUserByUsername } from "@/lib/firestore-service";
import { db } from "@/lib/firebase";
import { doc, getDoc, query, where, collection, onSnapshot } from "firebase/firestore";
import { getXpLevel, getXpProgress, addXp, setXp } from "@/lib/firestore-service";
import { usePWA } from "@/context/PWAContext";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { useTheme, ThemeType, BgType } from "@/context/ThemeContext";
import { Palette, Zap, ZapOff, Sparkles, Binary, Gamepad2, Layers, Move } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuth();
    const { theme, setTheme, bgType, setBgType, rgbEnabled, setRgbEnabled } = useTheme();
    const [nickname, setNickname] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [userClubs, setUserClubs] = useState<any[]>([]);
    const [isLoadingClubs, setIsLoadingClubs] = useState(true);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [acceptedId, setAcceptedId] = useState<string | null>(null);
    const [appInfo, setAppInfo] = useState<{ version: string; build: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [xp, setXpAmount] = useState(0);
    const [lastLevel, setLastLevel] = useState<number | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [levelUpInfo, setLevelUpInfo] = useState({ level: 1 });
    const [hideQuery, setHideQuery] = useState("");
    const [isHiding, setIsHiding] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const [targetUsername, setTargetUsername] = useState("");
    const [targetXp, setTargetXp] = useState("");
    const [isUpdatingXp, setIsUpdatingXp] = useState(false);
    const [isXpLoaded, setIsXpLoaded] = useState(false);

    const XP_TASKS = [
        { id: "review", name: "Post GOTM Review", xp: 50 },
        { id: "score", name: "Submit Score", xp: 25 },
        { id: "login", name: "Daily Login", xp: 10 },
        { id: "win", name: "Weekly Win", xp: 100 },
        { id: "friend", name: "Invite Friend", xp: 75 },
    ];
    const [simTaskId, setSimTaskId] = useState(XP_TASKS[0].id);

    useEffect(() => {
        if (user) {
            setNickname(user.displayName || "");
            setAvatarUrl(user.photoURL || "");

            // Sync with Firestore data if display name is missing in auth
            const fetchFirestoreData = async () => {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (!nickname && data.displayName) setNickname(data.displayName);
                    if (!avatarUrl && data.photoURL) setAvatarUrl(data.photoURL);

                    // Secure Developer Check
                    const isDev = data.role === 'developer' || data.displayName?.toLowerCase() === 'skezza82';
                    setIsDeveloper(isDev);
                }

                // Fetch User Clubs
                try {
                    const clubs = await getUserClubs(user.uid);
                    setUserClubs(clubs);
                } catch (err) {
                    console.error("Failed to load clubs", err);
                } finally {
                    setIsLoadingClubs(false);
                }
            };
            fetchFirestoreData();

            // Real-time Friend Requests
            const requestsQ = query(
                collection(db, "friend_requests"),
                where("receiverId", "==", user.uid),
                where("status", "==", "pending")
            );

            const unsubscribeRequests = onSnapshot(requestsQ, (snapshot) => {
                const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FriendRequest[];
                setFriendRequests(requests);
            });

            // Listen for XP
            const unsubXp = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    const currentXp = data.xp || 0;
                    setXpAmount(currentXp);

                    const currentLevel = getXpLevel(currentXp);
                    setLastLevel(prev => {
                        if (prev !== null && currentLevel > prev) {
                            setLevelUpInfo({ level: currentLevel });
                            setShowLevelUp(true);
                        }
                        return currentLevel;
                    });
                    setIsXpLoaded(true);
                }
            });

            return () => {
                unsubscribeRequests();
                unsubXp();
            };
        }

        // Fetch App Version Info (Capacitor)
        const fetchAppInfo = async () => {
            try {
                const info = await App.getInfo();
                setAppInfo({ version: info.version, build: info.build });
            } catch (e) {
                console.log("Not running in Capacitor/Native environment");
            }
        };
        fetchAppInfo();
    }, [user]);

    const router = useRouter();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            // Update both avatar and nickname
            await updateUserProfile(user.uid, {
                displayName: nickname,
                photoURL: avatarUrl
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);

            // Redirect based on club membership
            if (userClubs.length === 0) {
                router.push("/?welcome=true");
            } else {
                router.push("/");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarSelect = async (url: string) => {
        setAvatarUrl(url);
        if (!user) return;

        setIsSaving(true);
        try {
            await updateUserAvatar(user.uid, url);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Error setting avatar:", error);
            alert("Failed to update avatar.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const uploadedUrl = await uploadAvatar(user.uid, file);
            setAvatarUrl(uploadedUrl);

            // Auto-save the new URL to profile
            await updateUserAvatar(user.uid, uploadedUrl);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert("Upload failed. Make sure the file is an image and under 5MB.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRespondRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
        await respondToFriendRequest(requestId, status);
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    };

    const handleHideClub = async () => {
        if (!hideQuery) return;
        setIsHiding(true);
        try {
            const res = await hideClub(hideQuery);
            alert(`SUCCESS: Club "${res.name}" is now hidden from public. 🛡️`);
            setHideQuery("");
        } catch (error: any) {
            alert("ERROR: " + error.message);
        } finally {
            setIsHiding(false);
        }
    };

    const handleRandomizeBanners = async () => {
        if (!confirm("Are you sure you want to randomize banners for all clubs? (Excluding protected ones)")) return;
        setIsLoadingClubs(true);
        try {
            const count = await randomizeAllClubBanners(DEFAULT_BANNERS);
            alert(`SUCCESS: Randomly updated banners for ${count} clubs. 🎨`);
        } catch (error: any) {
            alert("ERROR: " + error.message);
        } finally {
            setIsLoadingClubs(false);
        }
    };

    const handleManualXpUpdate = async () => {
        if (!targetUsername || !targetXp) {
            alert("Username and XP are required.");
            return;
        }

        setIsUpdatingXp(true);
        try {
            const foundUser = await findUserByUsername(targetUsername);
            if (!foundUser) {
                alert("User not found.");
                return;
            }

            const xpNum = parseInt(targetXp);
            if (isNaN(xpNum)) {
                alert("Invalid XP value.");
                return;
            }

            if (confirm(`Set ${foundUser.displayName}'s total XP to ${xpNum}?`)) {
                await setXp(foundUser.uid, xpNum);
                alert(`Successfully set ${foundUser.displayName}'s XP to ${xpNum}.`);
                setTargetUsername("");
                setTargetXp("");
            }
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setIsUpdatingXp(false);
        }
    };

    const handleSimulateXpTask = async () => {
        if (!targetUsername) {
            alert("Username is required.");
            return;
        }

        setIsUpdatingXp(true);
        try {
            const foundUser = await findUserByUsername(targetUsername);
            if (!foundUser) {
                alert("User not found (Try exact case). If this is a legacy user, they must log in once to initialize their profile.");
                return;
            }

            const task = XP_TASKS.find(t => t.id === simTaskId);
            if (!task) return;

            await addXp(foundUser.uid, task.xp, `Simulated: ${task.name}`);

            // Re-fetch to confirm
            const updatedUser = await findUserByUsername(targetUsername);
            const newXp = updatedUser?.xp || 0;

            alert(`SUCCESS! 🚀\nAwarded ${task.xp} XP to ${foundUser.displayName}.\nNew Total XP: ${newXp}\n(If this didn't change, check Firestore rules/console)`);
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setIsUpdatingXp(false);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
                <Link href="/login">
                    <Button>Sign In</Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            {showLevelUp && (
                <LevelUpCelebration
                    level={levelUpInfo.level}
                    onClose={() => setShowLevelUp(false)}
                />
            )}
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <Link href="/" className="flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-1/3 space-y-6">
                        <Card className="border-primary/20 bg-surface/40 backdrop-blur-md overflow-hidden">
                            <div className="aspect-square relative group bg-black/20 flex items-center justify-center">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Profile Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-32 h-32 text-white/10" />
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                )}
                            </div>
                            <CardHeader className="text-center">
                                <CardTitle className="text-xl">{nickname || "Adventurer"}</CardTitle>
                                <CardDescription className="flex items-center justify-center gap-1">
                                    <Shield className="w-3 h-3 text-primary" />
                                    Club Member
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">Current Level</p>
                                    <h2 className="text-3xl font-black text-primary">
                                        {isXpLoaded ? `LVL ${getXpLevel(xp)}` : "---"}
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-white mb-1">{getXpProgress(xp).current} / {getXpProgress(xp).needed} XP</p>
                                </div>
                            </div>
                            <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
                                <div
                                    className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-1000 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                                    style={{ width: `${getXpProgress(xp).percentage}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center">
                                {getXpProgress(xp).needed - getXpProgress(xp).current} XP until Level {getXpLevel(xp) + 1}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-4">
                            <p className="text-xs font-bold text-primary tracking-widest uppercase">Choose Avatar</p>
                            <div className="grid grid-cols-3 gap-2">
                                {PRESET_AVATARS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => handleAvatarSelect(preset.url)}
                                        disabled={isSaving || isUploading}
                                        className={`aspect-square rounded-lg border-2 overflow-hidden transition-all ${avatarUrl === preset.url ? "border-primary scale-95" : "border-white/5 hover:border-white/20"
                                            } ${(isSaving || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-all group"
                                >
                                    <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    <span className="text-[10px] text-muted-foreground group-hover:text-primary">Upload</span>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                        <Card className="border-white/5 bg-surface/40 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black uppercase tracking-tighter">
                                    Account <span className="text-primary">Settings</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                                            <User className="w-4 h-4" /> Nickname
                                        </label>
                                        <Input
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            placeholder="Enter your gaming handle"
                                            className="bg-background/30 border-white/10"
                                        />
                                    </div>

                                    <div className="space-y-2 opacity-70">
                                        <label className="text-sm font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                                            <Mail className="w-4 h-4" /> Email Address
                                        </label>
                                        <Input
                                            value={user.email || ""}
                                            readOnly
                                            className="bg-background/10 border-white/5 cursor-not-allowed text-muted-foreground"
                                        />
                                    </div>

                                    <Button className="w-full neon-border font-black text-lg h-12" disabled={isSaving || isUploading}>
                                        {isSaving ? "Saving..." : saved ? (
                                            <span className="flex items-center gap-2 text-green-400">
                                                <CheckCircle className="w-5 h-5" /> Changes Saved
                                            </span>
                                        ) : "Update Profile"}
                                    </Button>

                                    <div className="pt-6 border-t border-white/5">
                                        <Link href="/delete-account">
                                            <Button variant="ghost" type="button" className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 h-12">
                                                Delete Account
                                            </Button>
                                        </Link>
                                    </div>

                                    <div className="text-center pt-2">
                                        <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                            Privacy Policy
                                        </Link>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>



                        <Card className="border-white/5 bg-surface/40 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                                    <Palette className="w-6 h-6 text-primary" />
                                    Appearance <span className="text-primary">Styles</span>
                                </CardTitle>
                                <CardDescription>Personalize your experience.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* Theme Selection */}
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Select Colour Scheme</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'cyber', name: 'Cyber', color: '#66FCF1' },
                                            { id: 'sunset', name: 'Sunset', color: '#FF7E5F' },
                                            { id: 'deepsea', name: 'Deep Sea', color: '#00D1FF' },
                                            { id: 'matrix', name: 'Matrix', color: '#00FF41' },
                                            { id: 'vampire', name: 'Vampire', color: '#FF2E2E' },
                                            { id: 'midnight', name: 'Midnight', color: '#A084E8' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTheme(t.id as ThemeType)}
                                                className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${theme === t.id ? 'border-primary bg-primary/5' : 'border-white/10 bg-black/20 hover:border-white/30'}`}
                                            >
                                                <div
                                                    className="w-full aspect-video rounded-md mb-1 relative overflow-hidden"
                                                    style={{ background: `radial-gradient(circle at center, ${t.color}33 0%, #000 100%)` }}
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                                        <div className="w-1 h-1 rounded-full bg-white animate-pulse" style={{ boxShadow: `0 0 10px ${t.color}` }} />
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === t.id ? 'text-primary' : 'text-muted-foreground'}`}>{t.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Motion Style Selection */}
                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                                        <Move className="w-3 h-3" /> Select Motion Style
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {[
                                            { id: 'connectivity', name: 'Nodes', icon: <Binary className="w-4 h-4" /> },
                                            { id: 'galaxy', name: 'Galaxy', icon: <Sparkles className="w-4 h-4" /> },
                                            { id: 'pacman', name: 'Arcade', icon: <Gamepad2 className="w-4 h-4" /> },
                                            { id: 'aurora', name: 'Aurora', icon: <Layers className="w-4 h-4" /> },
                                            { id: 'retrogrid', name: '80s Grid', icon: <Move className="w-4 h-4" /> }
                                        ].map((b) => (
                                            <button
                                                key={b.id}
                                                onClick={() => setBgType(b.id as BgType)}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${bgType === b.id ? 'border-primary bg-primary/5' : 'border-white/10 bg-black/20 hover:border-white/30'}`}
                                            >
                                                <div className={`${bgType === b.id ? 'text-primary' : 'text-muted-foreground'}`}>{b.icon}</div>
                                                <span className={`text-[8px] font-bold uppercase tracking-wider ${bgType === b.id ? 'text-primary' : 'text-muted-foreground'}`}>{b.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* RGB Toggle */}
                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2 text-sm">
                                            {rgbEnabled ? <Zap className="w-4 h-4 text-primary" /> : <ZapOff className="w-4 h-4 text-muted-foreground" />}
                                            RGB Effects
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Enable or disable neon and glowing elements</p>
                                    </div>
                                    <button
                                        onClick={() => setRgbEnabled(!rgbEnabled)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${rgbEnabled ? 'bg-primary' : 'bg-white/10'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rgbEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/5 bg-surface/40 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black uppercase tracking-tighter">
                                    Club <span className="text-primary">Administration</span>
                                </CardTitle>
                                <CardDescription>Manage the communities you lead.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Link href="/clubs/create" className="block mb-6">
                                        <Button variant="ghost" className="w-full border border-dashed border-white/10 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-primary">
                                            <PlusCircle className="w-4 h-4 mr-2" /> Start a New Club
                                        </Button>
                                    </Link>

                                    {isLoadingClubs ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : userClubs.length > 0 ? (
                                        <div className="grid gap-3">
                                            {userClubs.map(club => (
                                                <Link key={club.id} href={`/club/admin?id=${club.id}`}>
                                                    <div className="flex items-center p-3 rounded-lg bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all cursor-pointer group">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 overflow-hidden">
                                                            {club.logoUrl ? (
                                                                <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Shield className="w-5 h-5 text-primary" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-white group-hover:text-primary transition-colors">{club.name}</h4>
                                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-white/10 px-1.5 py-0.5 rounded-full">
                                                                {club.role}
                                                            </span>
                                                        </div>
                                                        <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic text-center py-4">
                                            You haven't joined any clubs yet.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <InstallAppButton />

                        {/* Developer Console (Test Buttons) - Admin Only */}
                        {isDeveloper && (
                            <Card className="border-red-500/20 bg-surface/40 backdrop-blur-md overflow-hidden animate-fade-in-up stagger-5 border-dashed">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <Binary className="w-4 h-4 text-red-500" />
                                        <CardTitle className="text-xs uppercase tracking-[0.3em] font-black text-white/50">Developer Console</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">XP Injection (Testing Only)</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] border-white/10 hover:bg-primary/20"
                                            onClick={() => addXp(user!.uid, 100, "Dev Bonus")}
                                        >
                                            +100 XP
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] border-white/10 hover:bg-primary/20"
                                            onClick={() => addXp(user!.uid, 500, "Dev Bonus")}
                                        >
                                            +500 XP
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] border-white/10 hover:bg-primary/20 text-primary"
                                            onClick={() => addXp(user!.uid, 1000, "Dev Bonus")}
                                        >
                                            +1000 XP
                                        </Button>
                                    </div>

                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2 pt-2">Level Management</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] border-red-500/30 text-red-500 hover:bg-red-500/10"
                                            onClick={() => setXp(user!.uid, 0)}
                                        >
                                            Reset to Level 1
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] border-white/10 hover:bg-primary/20"
                                            onClick={() => {
                                                const lvl = prompt("Enter target level:");
                                                if (lvl && !isNaN(Number(lvl))) {
                                                    const levelNum = Math.max(1, Number(lvl));
                                                    // Formula: 500 * L * (L-1)
                                                    const xpNeeded = 500 * levelNum * (levelNum - 1);
                                                    setXp(user!.uid, xpNeeded);
                                                }
                                            }}
                                        >
                                            Jump to Level...
                                        </Button>
                                    </div>

                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2 pt-2">Club Visibility Control</p>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                value={hideQuery}
                                                onChange={(e) => setHideQuery(e.target.value)}
                                                placeholder="Club ID, Name, or #Code"
                                                className="bg-black/30 border-white/10 text-[10px] h-8"
                                            />
                                            <Button
                                                size="sm"
                                                className="h-8 text-[10px] bg-red-600 hover:bg-red-700 whitespace-nowrap"
                                                disabled={isHiding}
                                                onClick={handleHideClub}
                                            >
                                                {isHiding ? "Hiding..." : "Hide Club"}
                                            </Button>
                                        </div>
                                        <p className="text-[8px] text-muted-foreground italic">Caution: Hiding is instant and removes club from discovery lists.</p>
                                    </div>

                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2 pt-4">Bulk Actions</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-[10px] border-primary/20 hover:bg-primary/10 gap-2"
                                        onClick={handleRandomizeBanners}
                                    >
                                        <ImageIcon className="w-3 h-3" />
                                        Randomize All Club Banners
                                    </Button>

                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2 pt-4">User XP Overwrite (Remote)</p>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex gap-1 col-span-2">
                                                <Input
                                                    value={targetUsername}
                                                    onChange={(e) => setTargetUsername(e.target.value)}
                                                    placeholder="Username (Exact Case)"
                                                    className="bg-black/30 border-white/10 text-[10px] h-8 flex-1"
                                                />
                                                <Button
                                                    size="sm"
                                                    className="h-8 text-[10px] bg-blue-600 hover:bg-blue-700 w-16"
                                                    disabled={isUpdatingXp}
                                                    onClick={async () => {
                                                        if (!targetUsername) return;
                                                        setIsUpdatingXp(true);
                                                        try {
                                                            const u = await findUserByUsername(targetUsername);
                                                            if (u) {
                                                                alert(`FOUND USER:\nName: ${u.displayName}\nID: ${u.uid}\nXP: ${u.xp || 0}\nLevel: ${getXpLevel(u.xp || 0)}\nDoc Exists: YES`);
                                                                setTargetXp((u.xp || 0).toString());
                                                            } else {
                                                                alert(`User "${targetUsername}" not found. Try exact casing.`);
                                                            }
                                                        } catch (e: any) {
                                                            alert("Error: " + e.message);
                                                        } finally {
                                                            setIsUpdatingXp(false);
                                                        }
                                                    }}
                                                >
                                                    Check
                                                </Button>
                                            </div>
                                            <Input
                                                type="number"
                                                value={targetXp}
                                                onChange={(e) => setTargetXp(e.target.value)}
                                                placeholder="New Total XP"
                                                className="bg-black/30 border-white/10 text-[10px] h-8 col-span-2"
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            className="w-full h-8 text-[10px] bg-red-600 hover:bg-red-700 font-black uppercase tracking-widest"
                                            disabled={isUpdatingXp}
                                            onClick={handleManualXpUpdate}
                                        >
                                            {isUpdatingXp ? "Updating..." : "SET USER TOTAL XP"}
                                        </Button>
                                    </div>

                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2 pt-4">XP Task Simulation</p>
                                    <div className="space-y-2">
                                        <select
                                            value={simTaskId}
                                            onChange={(e) => setSimTaskId(e.target.value)}
                                            className="w-full h-8 bg-black/30 border border-white/10 rounded px-2 text-[10px] text-white focus:outline-none focus:border-primary/50"
                                        >
                                            {XP_TASKS.map(task => (
                                                <option key={task.id} value={task.id} className="bg-surface text-white">
                                                    {task.name} (+{task.xp} XP)
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            size="sm"
                                            className="w-full h-8 text-[10px] bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest"
                                            disabled={isUpdatingXp}
                                            onClick={handleSimulateXpTask}
                                        >
                                            {isUpdatingXp ? "Simulating..." : "Simulate XP Award"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="pt-8 text-center space-y-1 opacity-30 group pb-8">
                            <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
                                {appInfo ? `ClubPlay Native v${appInfo.version} (${appInfo.build})` : "ClubPlay Web v1.71"}
                            </p>
                            <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest">
                                Update: {new Date().toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </main >
        </>
    );
}

function InstallAppButton() {
    const { isInstallable, install, isIOS, isInstalled } = usePWA();
    const [showInstructions, setShowInstructions] = useState(false);

    // Hide if already running as PWA
    if (isInstalled) return null;

    // Determine mode: Native Trigger vs Manual Instructions
    const hasNativeTrigger = isInstallable;

    // Instructions content based on platform
    // Default to generic "Browser Menu" instructions if not iOS
    const isGenericBrowser = !isIOS && !hasNativeTrigger;

    const handleClick = () => {
        if (hasNativeTrigger) {
            install();
        } else {
            setShowInstructions(!showInstructions);
        }
    };

    return (
        <Card className="border-primary/20 bg-surface/40 backdrop-blur-md overflow-hidden animate-fade-in-up">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Download className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white uppercase tracking-wider">Install App</h4>
                        <p className="text-xs text-muted-foreground">Get the full experience</p>
                    </div>
                </div>
                <Button
                    onClick={handleClick}
                    className="neon-border font-bold uppercase tracking-widest"
                >
                    {hasNativeTrigger ? "Install Now" : (showInstructions ? "Close Help" : "How to Install")}
                </Button>
            </CardContent>

            {/* Instructions Dropdown */}
            {showInstructions && (
                <div className="bg-primary/5 p-4 border-t border-white/5 animate-fade-in">
                    {isIOS ? (
                        <p className="text-white text-sm leading-relaxed mb-3">
                            Tap <span className="inline-block px-1 border border-white/20 rounded bg-white/5 mx-1 font-bold italic">Share</span> then select <span className="text-primary font-bold italic">"Add to Home Screen"</span>
                        </p>
                    ) : (
                        <p className="text-white text-sm leading-relaxed mb-3">
                            Tap your browser's menu (usually <span className="font-bold">⋮</span> or <span className="font-bold">☰</span>) and select <span className="text-primary font-bold italic">"Install App"</span> or <span className="text-primary font-bold italic">"Add to Home Screen"</span>
                        </p>
                    )}
                    <div className="flex justify-center text-primary">
                        <Download className="w-4 h-4 animate-bounce" />
                    </div>
                </div>
            )}
        </Card>
    )
}
