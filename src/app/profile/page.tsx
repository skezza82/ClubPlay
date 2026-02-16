"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PremiumLogo } from "@/components/PremiumLogo";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Shield, Camera, ArrowLeft, CheckCircle, PlusCircle, Upload, Loader2, Users, Search, XCircle, Heart, PartyPopper } from "lucide-react";
import Link from "next/link";
import { PRESET_AVATARS, uploadAvatar, updateUserAvatar } from "@/lib/avatar-service";
import { getUserClubs, updateUserProfile, getFriendRequests, respondToFriendRequest, FriendRequest } from "@/lib/firestore-service";
import { db } from "@/lib/firebase";
import { doc, getDoc, query, where, collection, onSnapshot } from "firebase/firestore";
import { usePWA } from "@/context/PWAContext";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { useTheme, ThemeType, BgType } from "@/context/ThemeContext";
import { Palette, Zap, ZapOff, Sparkles, Binary, Gamepad2, Layers, Move, HardDrive } from "lucide-react";
import { useGamepad } from "@/hooks/useGamepad";

export default function ProfilePage() {
    const { user } = useAuth();
    const { theme, setTheme, bgType, setBgType, rgbEnabled, setRgbEnabled } = useTheme();
    const { testingMode, toggleTestingMode } = useGamepad();
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

            return () => {
                unsubscribeRequests();
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

                            {/* Console Corner Testing Mode */}
                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2 text-sm">
                                        <HardDrive className={`w-4 h-4 ${testingMode ? 'text-primary' : 'text-muted-foreground'}`} />
                                        Hardware Mode
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Enable Console Corner without a physical gamepad</p>
                                </div>
                                <button
                                    onClick={toggleTestingMode}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${testingMode ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${testingMode ? 'translate-x-6' : 'translate-x-1'}`}
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

                    <div className="pt-8 text-center space-y-1 opacity-30 group pb-8">
                        <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
                            {appInfo ? `ClubPlay Native v${appInfo.version} (${appInfo.build})` : "ClubPlay Web v1.6.3"}
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
