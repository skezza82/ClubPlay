
"use client";

import { useState } from "react";
import { checkInviteCodeUnique, createClub } from "@/lib/firestore-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PremiumLogo } from "@/components/PremiumLogo";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, Camera, Upload } from "lucide-react";
import Link from "next/link";
import { DEFAULT_BANNERS, uploadClubBanner, uploadClubLogo } from "@/lib/avatar-service";
import { useRef } from "react";

export default function CreateClubPage() {
    const [name, setName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [bio, setBio] = useState("");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(DEFAULT_BANNERS[0].url);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("Please sign in to create a club!");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Check if invite code is unique
            const isUnique = await checkInviteCodeUnique(inviteCode.toUpperCase());
            if (!isUnique) {
                alert("This invite code is already taken. Please try another.");
                setIsLoading(false);
                return;
            }

            // 2. Upload Logo & Banner if selected
            let finalLogoUrl = null;
            let finalBannerUrl = bannerPreview; // Default to current preview (could be preset)

            const tempId = Math.random().toString(36).substring(7);

            if (logoFile) {
                finalLogoUrl = await uploadClubLogo(tempId, logoFile);
            } else if (logoPreview && !logoPreview.startsWith('blob:')) {
                finalLogoUrl = logoPreview;
            }

            if (bannerFile) {
                finalBannerUrl = await uploadClubBanner(tempId, bannerFile);
            }

            // 3. Create Club via Firestore
            const clubId = await createClub(
                name,
                inviteCode.toUpperCase(),
                user.uid,
                user.displayName || "Club Owner",
                user.photoURL || undefined,
                finalLogoUrl || undefined,
                finalBannerUrl || undefined,
                bio || undefined
            );

            alert("Club created successfully! 🎮");
            router.push(`/club/admin?id=${clubId}`);
        } catch (error: any) {
            alert("Error creating club: " + error.message);
        }

        setIsLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-2xl min-h-[calc(100vh-80px)] flex flex-col justify-center">
            <Link href="/clubs" className="flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Discovery
            </Link>

            <div className="mb-12 text-center animate-float">
                <PremiumLogo />
                <h2 className="text-3xl font-black text-white mt-4 uppercase tracking-tighter">Start Your Legacy</h2>
            </div>

            <Card className="border-primary/20 shadow-2xl shadow-primary/5 bg-surface/40 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle>Club Registration</CardTitle>
                    <CardDescription>Establish your community and compete in the weekly arena.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="flex flex-col gap-8 mb-4">
                            {/* Logo Row */}
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="flex flex-col items-center gap-3">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-24 h-24 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group shadow-xl"
                                    >
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
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
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <p className="text-[8px] text-zinc-500 uppercase tracking-[0.2em] font-black">Upload Logo</p>
                                </div>

                                <div className="flex-1 w-full pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/5 md:pl-6">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-3">Or Choose a Preset Icon</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[
                                            { id: 'controller', url: '/avatars/club-icons/controller.svg' },
                                            { id: 'arcade', url: '/avatars/club-icons/arcade.svg' },
                                            { id: 'trophy', url: '/avatars/club-icons/trophy.svg' },
                                            { id: 'swords', url: '/avatars/club-icons/swords.svg' },
                                            { id: 'rocket', url: '/avatars/club-icons/rocket.svg' },
                                        ].map((icon) => (
                                            <button
                                                key={icon.id}
                                                type="button"
                                                onClick={() => {
                                                    setLogoPreview(icon.url);
                                                    setLogoFile(null);
                                                }}
                                                className={`aspect-square rounded-full border-2 overflow-hidden transition-all bg-black/20 ${logoPreview === icon.url
                                                    ? "border-primary scale-95 shadow-[0_0_10px_rgba(0,242,234,0.3)]"
                                                    : "border-white/5 hover:border-white/20 hover:scale-105"
                                                    }`}
                                            >
                                                <img src={icon.url} alt={icon.id} className="w-full h-full object-cover p-2" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Banner Section */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-primary tracking-[0.2em] uppercase">Club Banner</label>
                                <div
                                    onClick={() => bannerInputRef.current?.click()}
                                    className="relative w-full h-32 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 hover:border-primary/50 transition-all cursor-pointer overflow-hidden group shadow-2xl"
                                >
                                    {bannerPreview ? (
                                        <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Upload Custom Banner</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                                        Update Banner
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={bannerInputRef}
                                    onChange={handleBannerChange}
                                    className="hidden"
                                    accept="image/*"
                                />

                                <div className="space-y-2">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Or Choose a Premium Banner</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {DEFAULT_BANNERS.map((banner) => (
                                            <button
                                                key={banner.id}
                                                type="button"
                                                onClick={() => {
                                                    setBannerPreview(banner.url);
                                                    setBannerFile(null);
                                                }}
                                                className={`aspect-[3/1] rounded-lg border-2 overflow-hidden transition-all bg-black/20 ${bannerPreview === banner.url
                                                    ? "border-primary scale-95 shadow-[0_0_10px_rgba(0,242,234,0.3)]"
                                                    : "border-white/5 hover:border-white/20 hover:scale-105"
                                                    }`}
                                            >
                                                <img src={banner.url} alt={banner.name} className="w-full h-full object-cover" title={banner.name} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary tracking-widest uppercase">Club Name</label>
                            <Input
                                placeholder="e.g. The Neon Knights"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-background/30 border-white/10 focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary tracking-widest uppercase">Unique Invite Code</label>
                            <Input
                                placeholder="e.g. NEON"
                                required
                                maxLength={4}
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                className="bg-background/30 border-white/10 focus:border-primary/50 font-mono rounded-full"
                            />
                            <p className="text-[10px] text-muted-foreground">4 characters max. This will be used for joining your club.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary tracking-widest uppercase">Club Bio (Optional)</label>
                            <textarea
                                placeholder="Tell us what your club is about..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full bg-background/30 border border-white/10 focus:border-primary/50 rounded-2xl p-3 min-h-[100px] text-sm resize-none"
                                maxLength={200}
                            />
                            <p className="text-[10px] text-muted-foreground text-right">{bio.length}/200</p>
                        </div>

                        <Button className="w-full neon-border font-black text-lg h-14 rounded-2xl" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                "CREATE CLUB"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
