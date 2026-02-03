"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PremiumLogo } from "@/components/PremiumLogo";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Shield, Camera, ArrowLeft, CheckCircle, PlusCircle, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { PRESET_AVATARS, uploadAvatar, updateUserAvatar } from "@/lib/avatar-service";
import { getUserClubs } from "@/lib/firestore-service";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ProfilePage() {
    const { user } = useAuth();
    const [nickname, setNickname] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [userClubs, setUserClubs] = useState<any[]>([]);
    const [isLoadingClubs, setIsLoadingClubs] = useState(true);
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
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            await updateUserAvatar(user.uid, avatarUrl);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
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
                        <div className="aspect-square relative group">
                            <img
                                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                                alt="Profile Avatar"
                                className="w-full h-full object-cover"
                            />
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
                            </form>
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
                                            <Link key={club.id} href={`/clubs/${club.id}/admin`}>
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
                </div>
            </div>
        </main>
    );
}
