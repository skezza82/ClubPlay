"use client";

import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GameActions } from "@/components/GameActions";
import { PremiumLogo } from "@/components/PremiumLogo";
import { UserProfile } from "@/components/UserProfile";
import { UserAvatar } from "@/components/UserAvatar";
import { AuthGate } from "@/components/AuthGate";

import { Trophy, Gamepad2, Users, Loader2, Shield, Plus, ArrowRight, Info, Search, CheckCircle2, Circle, Sparkles, XCircle, Layers, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import {
  getActiveSession,
  getUserClubs,
  getCurrentGOTM,
  getClub,
  getSessionLeader,
  getUserQuestStatus,
  syncQuestProgress,
  Score,
  getPendingClubInvites,
  respondToClubInvite,
  ClubInvite
} from "@/lib/firestore-service";
import { useSearchParams } from "next/navigation";

function getLibretroBoxartUrl(gameName: string, platform: string) {
  if (!gameName || !platform) return "/images/retro-club-bg.png";
  const formattedPlatform = platform.replace(/\s+/g, '_');
  const formattedGame = gameName.replace(/\s+/g, '_');
  return `https://thumbnails.libretro.com/${formattedPlatform}/Named_Boxarts/${formattedGame}.png`;
}

function QuestItem({ title, xp, isDone, link }: { title: string, xp: number, isDone: boolean, link: string }) {
  return (
    <Link href={link}>
      <div className={`p-3 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.02] active:scale-[0.98] ${isDone ? 'bg-primary/5 border-primary/20 text-primary/60' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
        <div className="flex items-center gap-3">
          {isDone ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
          <span className={`text-sm font-bold ${isDone ? 'line-through opacity-50' : ''}`}>{title}</span>
        </div>
        <div className={`text-[10px] font-black italic px-2 py-0.5 rounded ${isDone ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'}`}>
          +{xp} XP
        </div>
      </div>
    </Link>
  );
}

function HomeContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [userClubs, setUserClubs] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gotm, setGotm] = useState<any>(null);
  const [topScore, setTopScore] = useState<Score | null>(null);
  const [featuredSession, setFeaturedSession] = useState<any>(null);
  const [clubInvites, setClubInvites] = useState<ClubInvite[]>([]);
  const [featuredGame, setFeaturedGame] = useState<any>(null);
  const [featuredLeader, setFeaturedLeader] = useState<Score | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [questDismissed, setQuestDismissed] = useState(false);
  const [isArcadeDone, setIsArcadeDone] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Check if on native app
    setIsNative(!!(window as any).Capacitor);

    // Check if arcade has been visited
    const visited = localStorage.getItem('arcade_visited') === 'true';
    setIsArcadeDone(visited);

    // Check if quest was dismissed
    const dismissed = localStorage.getItem('quest_dismissed') === 'true';
    setQuestDismissed(dismissed);

    // ONE-TIME FIX: Patch broken banners
    const fixBanners = async () => {
      if (localStorage.getItem('banners_fixed')) return;
      try {
        const newUrl = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200&h=400";
        await updateDoc(doc(db, "clubs", "6GiEgXsWCNgOgkKSapsR"), { bannerUrl: newUrl });
        await updateDoc(doc(db, "clubs", "UhiAu0qgPtC5eUFe2cSe"), { bannerUrl: newUrl });
        localStorage.setItem('banners_fixed', 'true');
        console.log("Successfully patched broken banners.");
      } catch (err) {
        console.error("Failed to patch banners:", err);
      }
    };
    fixBanners();
  }, []);

  const isHandleDone = !!(user?.displayName && !user.displayName.includes('@'));
  const isAvatarDone = !!(user?.photoURL && !user.photoURL.includes('default') && !user.photoURL.includes('gravatar'));
  const isClubDone = userClubs.length > 0;
  const allQuestsDone = isHandleDone && isAvatarDone && isClubDone && isArcadeDone;

  const handleDismissQuest = () => {
    setQuestDismissed(true);
    localStorage.setItem('quest_dismissed', 'true');
    setShowCelebration(false);
  };

  useEffect(() => {
    if (allQuestsDone && !questDismissed && userClubs.length > 0) {
      const hasCelebrated = localStorage.getItem('quest_celebrated') === 'true';
      if (!hasCelebrated) {
        setShowCelebration(true);
        localStorage.setItem('quest_celebrated', 'true');

        // Auto-dismiss after 10 seconds
        const timer = setTimeout(() => {
          handleDismissQuest();
        }, 10000);

        return () => clearTimeout(timer);
      }
    }
  }, [allQuestsDone, questDismissed, userClubs.length]);

  useEffect(() => {
    async function initData() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true); // Restart loading if user changes
        const clubs = await getUserClubs(user.uid);
        setUserClubs(clubs);

        const invites = await getPendingClubInvites(user.uid);
        setClubInvites(invites);

        if (user) {
          const questStatus = await getUserQuestStatus(user.uid);
          if (questStatus?.arcadeVisited) {
            setIsArcadeDone(true);
            localStorage.setItem('arcade_visited', 'true');
          }
        }

        if (clubs.length > 0) {
          // Find the best club to show: priority to the most recent club with an active session
          let selectedClubId = clubs[0].id;
          let bestSession = null;

          // Check top 5 most recent clubs for an active session to prioritize engagement
          const topClubs = clubs.slice(0, 5);
          const sessionResults = await Promise.all(
            topClubs.map(c => getActiveSession(c.id))
          );

          const foundIdx = sessionResults.findIndex(s => s !== null);
          if (foundIdx !== -1) {
            selectedClubId = topClubs[foundIdx].id;
            const session = sessionResults[foundIdx];

            // Only show if NOT processed and NOT expired
            const now = new Date();
            const isExpired = session && session.endDate && new Date(session.endDate) <= now;

            if (session && !session.isProcessed && !isExpired) {
              setActiveSession(session);
              setGame({ title: session.gameTitle, platform: session.platform, cover_image_url: session.cover_image_url });
              const leader = await getSessionLeader(session.id);
              setTopScore(leader);
            } else {
              setActiveSession(null);
            }
          }

          const currentGotm = await getCurrentGOTM(selectedClubId);
          setGotm(currentGotm);
        } else {
          // Featured Challenge for new users
          const retroRacersId = "pTfN9mInm45NOfS82X9b"; // Mock or real ID for public club
          const session = await getActiveSession(retroRacersId);
          if (session) {
            setFeaturedSession(session);
            setFeaturedGame({ title: session.gameTitle, platform: session.platform, cover_image_url: session.cover_image_url });
            const leader = await getSessionLeader(session.id);
            setFeaturedLeader(leader);
          }
        }

        // Backfill missing quest XP
        if (user) {
          await syncQuestProgress(
            user.uid,
            clubs.length,
            user.displayName || "",
            user.photoURL || ""
          );
        }
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      initData();
    }
  }, [user, authLoading]);

  // Handle Loading State
  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center relative overflow-hidden">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-primary font-mono animate-pulse">Initializing Interface...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8 relative min-h-screen border-none">

      {!user ? (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <AuthGate />
        </div>
      ) : (
        <>
          {showCelebration && (
            <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] animate-fade-in" />
              <div className="relative p-12 bg-surface/90 border-2 border-primary rounded-3xl shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] text-center animate-bounce-in pointer-events-auto">
                <Sparkles className="w-20 h-20 text-primary mx-auto mb-6 animate-pulse" />
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Initiation Complete!</h2>
                <p className="text-primary font-bold uppercase tracking-widest mb-8">You are now a verified Elite Gamer</p>
                <Button onClick={handleDismissQuest} className="neon-border px-8">Continue Journey</Button>
              </div>
            </div>
          )}

          {/* Hero Section - Still show if user has NO clubs */}
          {userClubs.length === 0 && (
            <section className="mb-16 text-center relative flex flex-col items-center animate-fade-in-up stagger-1 min-h-[20vh] justify-center">
              {searchParams.get('welcome') === 'true' && (
                <div className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-xl max-w-2xl mx-auto backdrop-blur-md animate-bounce-in">
                  <h2 className="text-2xl font-black text-white italic uppercase mb-2">Welcome to the Club!</h2>
                  <p className="text-white/80">
                    ClubPlay is all about <span className="text-primary font-bold">building communities</span> and competing for glory.
                    <br />Find a club below or create your own to start your legacy!
                  </p>
                </div>
              )}
              <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter mb-4">
                Join the <span className="text-primary">Elite</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Compete with friends in weekly gaming challenges. <span className="text-primary font-bold">One Game. One Week. One Champion.</span>
              </p>
            </section>
          )}

          {/* CLUB INVITES SECTION */}
          {clubInvites.length > 0 && (
            <section className="mb-12 animate-fade-in-up stagger-1">
              <h3 className="text-lg font-bold text-primary uppercase tracking-wider mb-4">Pending Invites</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {clubInvites.map(invite => (
                  <div key={invite.id} className="bg-surface/60 border border-primary/30 p-4 rounded-xl backdrop-blur-md flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-lg">{invite.clubName}</h4>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Invited by: {invite.senderName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/30"
                        onClick={async () => {
                          await respondToClubInvite(invite.id, 'accepted', user.uid, user.displayName || "Unknown", user.photoURL || undefined);
                          setClubInvites(prev => prev.filter(i => i.id !== invite.id));
                          // Refresh clubs
                          const newClubs = await getUserClubs(user.uid);
                          setUserClubs(newClubs);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        onClick={async () => {
                          await respondToClubInvite(invite.id, 'rejected', user.uid, user.displayName || "Unknown", user.photoURL || undefined);
                          setClubInvites(prev => prev.filter(i => i.id !== invite.id));
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* YOUR CLUBS SECTION */}
          {userClubs.length > 0 && (
            <>
              <section className="mb-12 animate-fade-in-up stagger-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" /> Your Clubs
                  </h3>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-white">Manage</Button>
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {userClubs.map(club => (
                    <Link key={club.id} href={`/club?id=${club.id}`} className="flex-shrink-0">
                      <Card className="w-64 h-32 border-white/5 bg-surface/60 backdrop-blur-md hover:border-primary/50 transition-all group relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
                          <Image
                            src={club.logoUrl || "/images/retro-club-bg.png"}
                            alt={club.name}
                            fill
                            className="object-cover"
                            unoptimized={!!club.logoUrl}
                            priority
                            loading="eager"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        <CardContent className="absolute bottom-0 left-0 p-4 w-full">
                          <h4 className="font-black text-white text-lg truncate group-hover:text-primary transition-colors">{club.name}</h4>
                          <p className="text-xs text-gray-400 flex items-center justify-between">
                            <span>{club.role === 'owner' ? 'Owner' : 'Member'}</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-primary" />
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  <Link href="/clubs/create" className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-xl border border-dashed border-white/10 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all text-muted-foreground hover:text-primary">
                      <Plus className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">New Club</span>
                    </div>
                  </Link>
                </div>
              </section>

              {/* Game of the Week Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="md:col-span-2 rgb-neon-border animate-fade-in-up stagger-3">
                  <Card className="relative overflow-hidden border-none bg-surface/40 h-full min-h-[400px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10" />

                    {game?.cover_image_url || (game?.title && game?.platform) ? (
                      <div className="absolute inset-0 opacity-40">
                        <Image
                          src={game.cover_image_url || getLibretroBoxartUrl(game.title, game.platform)}
                          alt={game.title}
                          fill
                          className="object-cover object-center"
                          priority
                          loading="eager"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-900/20 opacity-40" />
                    )}

                    <div className="relative z-20 p-8 h-full flex flex-col justify-end">
                      <div className="mb-6">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3 border border-primary/30">
                          {activeSession ? "Active Challenge" : "Preparation Phase"}
                        </span>

                        {game ? (
                          <>
                            <h2 className="text-5xl md:text-7xl font-black text-white mb-3 drop-shadow-2xl italic uppercase tracking-tighter">
                              {game.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-4 text-white/90 font-bold uppercase tracking-widest text-sm mb-6">
                              <span className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                <Gamepad2 className="w-4 h-4 text-primary" />
                                {game.platform}
                              </span>
                              {activeSession?.rules && (
                                <span className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                  <Shield className="w-4 h-4 text-primary" />
                                  Special Rules Active
                                </span>
                              )}
                            </div>

                            {topScore && (
                              <div className="mb-6 flex items-center gap-4 bg-black/40 backdrop-blur-md p-3 pr-6 rounded-2xl border border-yellow-500/20 max-w-fit animate-fade-in group/leader">
                                <UserAvatar
                                  photoURL={topScore.photoURL}
                                  displayName={topScore.displayName || ""}
                                  xp={topScore.xp || 0}
                                  size="md"
                                  isWinner={true}
                                />
                                <div>
                                  <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest leading-tight">Current Leader</p>
                                  <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-white font-black text-xl tracking-tight truncate max-w-[150px]">{topScore.displayName || "Unknown"}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-4">
                              <Link href={activeSession ? `/club?id=${activeSession.clubId}` : "/profile"}>
                                <Button className="w-full shadow-none">
                                  {activeSession ? "Enter the Arena" : "View Club"}
                                </Button>
                              </Link>
                            </div>
                          </>
                        ) : (
                          <>
                            <h2 className="text-4xl font-black text-white/50 mb-3 italic uppercase tracking-tighter">
                              No active challenge
                            </h2>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                              Your club admin hasn't set the next Game of the Week yet. Check back soon!
                            </p>
                            <Link href="/clubs">
                              <Button variant="outline" className="h-12 px-8 border-white/10 text-white font-bold hover:bg-white/5">
                                Explore Clubs
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Game of the Month Card */}
                <div className="md:col-span-1 animate-fade-in-up stagger-4">
                  <Link href={gotm ? `/club?id=${gotm.clubId}&tab=gotm` : '#'}>
                    <Card className="relative overflow-hidden border-primary/20 bg-surface/40 h-full min-h-[400px] hover:border-primary/50 transition-colors group cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-black/80 z-10" />

                      {gotm?.coverUrl ? (
                        <div className="absolute inset-0 opacity-50 group-hover:scale-105 transition-transform duration-700">
                          <Image
                            src={gotm.coverUrl}
                            alt={gotm.title}
                            fill
                            className="w-full h-full object-cover"
                            priority
                            loading="eager"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-black opacity-50" />
                      )}

                      <div className="relative z-20 p-6 h-full flex flex-col justify-end items-start text-left">
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20 mb-3 backdrop-blur-md">
                          Game of the Month
                        </span>

                        {gotm ? (
                          <>
                            <h3 className="text-3xl font-black text-white italic uppercase leading-tight mb-2 drop-shadow-xl">{gotm.title}</h3>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                              <Gamepad2 className="w-3 h-3 text-primary" /> {gotm.platform}
                            </p>
                            <div className="w-full h-9 flex items-center justify-center rounded-md bg-primary/20 group-hover:bg-primary/40 text-primary border border-primary/30 font-bold uppercase tracking-widest backdrop-blur-md text-sm transition-colors">
                              View Overview
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="text-2xl font-black text-white/50 italic uppercase mb-2">Not Active</h3>
                            <p className="text-muted-foreground text-xs mb-6">No monthly game selected yet.</p>
                          </>
                        )}
                      </div>
                    </Card>
                  </Link>
                </div>
              </div>

              {/* Arcade Promo Banner */}
              <section className="mb-12 animate-fade-in-up stagger-4">
                <Link href="/arcade">
                  <Card className="border-white/10 bg-surface/40 hover:border-purple-500/50 transition-all cursor-pointer group relative overflow-hidden h-48 md:h-56">
                    <div className="absolute inset-0 opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700">
                      <img
                        src="/images/retro-club-bg.png"
                        className="w-full h-full object-cover"
                        alt="Retro Video Game Cabinets"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-purple-900/40 to-black/80 z-10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.2),transparent_70%)] z-10" />
                    <CardContent className="h-full p-8 flex items-center justify-between relative z-20">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 group-hover:bg-purple-500/40 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-sm">
                          <Gamepad2 className="w-8 h-8 text-purple-400 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-purple-400 transition-colors mb-2 drop-shadow-md">The Arcade</h3>
                          <p className="text-white/80 font-bold uppercase tracking-tight text-sm md:text-lg max-w-md">No Club? No Problem. Play free classic games instantly.</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="hidden md:flex items-center gap-2 text-purple-400 group-hover:text-purple-300 font-black uppercase tracking-widest text-lg">
                        Enter Arcade <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in-up stagger-5">
                <Link href="/clubs" className="contents">
                  <Button variant="ghost" className="h-auto py-6 flex flex-col gap-2 border border-white/5 hover:border-primary/50 bg-surface/50 cursor-pointer transition-transform hover:scale-105 active:scale-95">
                    <Users className="w-8 h-8 text-primary" />
                    <span className="font-bold">Find a Club</span>
                    <span className="text-xs text-muted-foreground">Join an existing squad</span>
                  </Button>
                </Link>
                <Link href="/clubs/create" className="contents">
                  <Button variant="ghost" className="h-auto py-6 flex flex-col gap-2 border border-white/5 hover:border-orange-500/50 bg-surface/50 cursor-pointer transition-transform hover:scale-105 active:scale-95">
                    <Users className="w-8 h-8 text-orange-500" />
                    <span className="font-bold">Create a Club</span>
                    <span className="text-xs text-muted-foreground">Start your own legacy</span>
                  </Button>
                </Link>
                <Link href="/search" className="contents">
                  <Button variant="ghost" className="h-auto py-6 flex flex-col gap-2 border border-white/5 hover:border-blue-500/50 bg-surface/50 cursor-pointer transition-transform hover:scale-105 active:scale-95">
                    <Search className="w-8 h-8 text-blue-500" />
                    <span className="font-bold">Find Players</span>
                    <span className="text-xs text-muted-foreground">Discover other gamers</span>
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Rookie Quest Card - Show if not dismissed or if still in progress */}
          {(!questDismissed || userClubs.length === 0) && (
            <section className={`mb-12 animate-fade-in-up stagger-2 text-center ${userClubs.length > 0 ? 'mt-12 pt-12 border-t border-white/5' : 'py-4'}`}>
              <div className="max-w-4xl mx-auto space-y-12">
                {/* Rookie Quest Card */}
                <Card className={`border-primary/20 bg-surface/40 backdrop-blur-xl relative overflow-hidden group transition-all ${allQuestsDone ? 'border-green-500/30 bg-green-500/5' : ''}`}>
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    {allQuestsDone ? <CheckCircle2 className="w-32 h-32 text-green-500" /> : <Sparkles className="w-32 h-32 text-primary" />}
                  </div>
                  <CardHeader className="pb-2 text-left relative z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className={`text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2 ${allQuestsDone ? 'text-green-500' : 'text-primary'}`}>
                          <Trophy className="w-3 h-3" /> Gamer Discovery Quest
                        </CardTitle>
                        <CardDescription className="text-white font-bold text-lg italic">
                          {allQuestsDone ? "Initiation successful! You've earned all bonus XP." : "Complete your initiation to earn Bonus XP!"}
                        </CardDescription>
                      </div>
                      {allQuestsDone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDismissQuest}
                          className="text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-white"
                        >
                          Dismiss Quest <XCircle className="w-3 h-3 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-6 pt-4 relative z-10">
                    <div className="space-y-3">
                      <QuestItem
                        title="Customize Gamer Handle"
                        xp={50}
                        isDone={isHandleDone}
                        link="/profile"
                      />
                      <QuestItem
                        title="Upload Profile Avatar"
                        xp={50}
                        isDone={isAvatarDone}
                        link="/profile"
                      />
                      <QuestItem
                        title="Join Your First Club"
                        xp={100}
                        isDone={isClubDone}
                        link="/clubs"
                      />
                      <QuestItem
                        title="Explore The Arcade"
                        xp={25}
                        isDone={isArcadeDone}
                        link="/arcade"
                      />
                    </div>
                    <div className={`rounded-2xl p-6 border flex flex-col justify-center items-center text-center transition-colors ${allQuestsDone ? 'bg-green-500/20 border-green-500/30' : 'bg-black/40 border-white/5'}`}>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border transition-colors ${allQuestsDone ? 'bg-green-500/20 border-green-500/50' : 'bg-primary/20 border-primary/30'}`}>
                        <Trophy className={`w-8 h-8 ${allQuestsDone ? 'text-green-500' : 'text-primary'}`} />
                      </div>
                      <h4 className="font-black text-white italic uppercase tracking-tighter text-xl">
                        {allQuestsDone ? "Initiated" : "Ascend the Ranks"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-2">
                        {allQuestsDone
                          ? "You've completed the Rookie tutorial. Now go forth and conquer the leaderboards!"
                          : "Earn XP to level up, unlock badges, and gain respect in the community."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Hide other initial CTA stuff if player has clubs */}
                {userClubs.length === 0 && (
                  <>
                    {/* Featured Challenge Glimpse */}
                    {featuredSession && (
                      <div className="space-y-6 animate-fade-in-up stagger-3">
                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-white/10" />
                          <span className="text-[10px] text-primary font-black uppercase tracking-[0.4em]">Live Now in the Community</span>
                          <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <Link href={`/clubs`}>
                          <Card className="relative overflow-hidden border-primary/30 bg-surface/50 h-[320px] group cursor-pointer hover:border-primary/60 transition-all">
                            <div className="absolute inset-0 z-10 bg-gradient-to-r from-black via-black/60 to-transparent" />
                            {featuredGame?.cover_image_url ? (
                              <div className="absolute inset-0 opacity-40">
                                <Image
                                  src={featuredGame.cover_image_url}
                                  alt={featuredGame.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                                  priority
                                  loading="eager"
                                />
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-900/30 opacity-40" />
                            )}

                            <div className="relative z-20 p-8 h-full flex flex-col justify-center items-start text-left max-w-xl">
                              <span className="bg-primary text-black text-[10px] font-black uppercase px-2 py-0.5 rounded mb-4">Featured Challenge</span>
                              <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-2 drop-shadow-xl">{featuredGame?.title || "Active Battle"}</h2>
                              <div className="flex items-center gap-4">
                                <p className="text-white/80 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                  <Gamepad2 className="w-4 h-4 text-primary" /> {featuredGame?.platform || "Retro System"}
                                </p>
                              </div>

                              {featuredLeader && (
                                <div className="mt-6 flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 pr-4 rounded-xl border border-yellow-500/20">
                                  <UserAvatar photoURL={featuredLeader.photoURL} displayName={featuredLeader.displayName || ""} size="md" isWinner={true} />
                                  <div className="text-left">
                                    <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-widest">Current Leader</p>
                                    <p className="text-white font-black italic max-w-[150px] truncate">{featuredLeader.displayName || "Unknown"}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="absolute bottom-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 transition-all">
                              <Button className="neon-border">Experience the Club <ArrowRight className="w-4 h-4 ml-2" /></Button>
                            </div>
                          </Card>
                        </Link>
                      </div>
                    )}

                    <div className="bg-surface/40 p-12 rounded-3xl border border-white/5 backdrop-blur-xl relative overflow-hidden">
                      <Shield className="w-16 h-16 text-primary mx-auto mb-6 opacity-50" />
                      <h3 className="text-2xl font-black text-white mb-4 italic uppercase">Your Journey Begins Here</h3>
                      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                        To access the weekly challenges, scoreboards, and club leaderboards, you need to be part of a club community.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                        <Link href="/clubs/create">
                          <Button className="w-full neon-border h-14 text-sm font-black italic uppercase tracking-widest">
                            Create Your Club
                          </Button>
                        </Link>
                        <Link href="/clubs">
                          <Button variant="ghost" className="w-full h-14 border border-white/10 text-white font-bold hover:bg-white/10 text-sm">
                            Join a Club
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {!isNative && (
        <div className="mt-24 mb-12 flex flex-col items-center gap-10">
          <div className="flex items-center gap-6 w-full max-w-2xl px-4">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-primary/60 whitespace-nowrap drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]">
              Experience ClubPlay Everywhere
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="flex flex-wrap justify-center gap-6 px-4">
            <a
              href="https://play.google.com/store/apps/details?id=com.clubplaygaming.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Button className="bg-black hover:bg-neutral-900 border border-white/10 hover:border-primary/50 text-white h-16 px-10 rounded-2xl flex items-center gap-5 transition-all hover:scale-[1.05] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] active:scale-95">
                <div className="relative">
                  <div className="absolute -inset-1.5 bg-gradient-to-br from-[#4285F4] via-[#EA4335] to-[#FBBC05] rounded-xl blur opacity-40 group-hover:opacity-80 transition-opacity" />
                  <div className="relative w-10 h-10 rounded-xl bg-black flex items-center justify-center border border-white/10">
                    <Gamepad2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Get it on</span>
                  <span className="text-xl font-black italic tracking-tighter">Google Play</span>
                </div>
              </Button>
            </a>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-white/5 rounded-2xl blur opacity-10" />
              <Button
                variant="outline"
                className="relative border-white/5 bg-white/2 backdrop-blur-md text-white h-16 px-10 rounded-2xl flex items-center gap-5 opacity-50 cursor-not-allowed group-hover:opacity-60 transition-opacity"
                disabled
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Coming Soon</span>
                  <span className="text-xl font-black italic tracking-tighter opacity-70">App Store</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center relative overflow-hidden">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-primary font-mono">Loading Space Station...</p>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
