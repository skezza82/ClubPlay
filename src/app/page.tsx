"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GameActions } from "@/components/GameActions";
import { PremiumLogo } from "@/components/PremiumLogo";
import { UserProfile } from "@/components/UserProfile";
import { UserAvatar } from "@/components/UserAvatar";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabase";
import { Trophy, Gamepad2, Users, Loader2, Shield, Plus, ArrowRight, Info, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getLatestClubMembership,
  getActiveSession,
  getUserClubs,
  getCurrentGOTM,
  getSessionLeader, // Added import
  type GOTM,
  type Score // Added import
} from "@/lib/firestore-service";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getLibretroBoxartUrl } from "@/lib/libretro-utils";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function HomeContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [game, setGame] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [topScore, setTopScore] = useState<Score | null>(null); // Added state
  const [gotm, setGotm] = useState<GOTM | null>(null);
  const [loading, setLoading] = useState(true);
  const [userClubs, setUserClubs] = useState<any[]>([]);

  useEffect(() => {
    async function initData() {
      if (user) {
        try {
          // 1. Fetch user clubs
          const clubs = await getUserClubs(user.uid);

          // 1.5 Fetch User Profile for Last Visited
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const lastVisitedId = userDoc.exists() ? userDoc.data().lastVisitedClubId : null;

          // Sort clubs by last visited
          const sortedClubs = [...clubs].sort((a, b) => {
            if (lastVisitedId) {
              if (a.id === lastVisitedId) return -1;
              if (b.id === lastVisitedId) return 1;
            }
            return 0;
          });
          setUserClubs(sortedClubs);

          // 2. Fetch Active Sessions for ALL clubs
          const sessionPromises = clubs.map(club => getActiveSession(club.id));
          const sessions = await Promise.all(sessionPromises);

          // Filter valid active sessions and sort
          const activeSessions = sessions
            .filter((s): s is any => s !== null && s.isActive)
            .sort((a, b) => {
              // Priority 1: Last Visited Club
              if (lastVisitedId) {
                if (a.clubId === lastVisitedId) return -1;
                if (b.clubId === lastVisitedId) return 1;
              }
              // Priority 2: Soonest End Date
              return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
            });

          const soonestSession = activeSessions[0] || null;
          setActiveSession(soonestSession);

          if (soonestSession) {
            // Fetch Top Score for this session
            const leader = await getSessionLeader(soonestSession.id);
            setTopScore(leader);

            if (soonestSession.gameId) {
              const { data: gameData } = await supabase.from('games').select('*').eq('id', soonestSession.gameId).single();
              if (gameData) {
                setGame(gameData);
              } else {
                setGame({
                  title: soonestSession.gameTitle,
                  platform: soonestSession.platform,
                  cover_image_url: soonestSession.cover_image_url || null
                });
              }
            } else {
              setGame({
                title: soonestSession.gameTitle,
                platform: soonestSession.platform,
                cover_image_url: soonestSession.cover_image_url || null
              });
            }
          } else {
            setGame(null);
            setTopScore(null);
          }

          // 3. Fetch GOTM for the Target Club
          // Priority: Active Session's Club -> Last Visited Club -> First Club
          let targetClubId = soonestSession?.clubId;
          if (!targetClubId && sortedClubs.length > 0) {
            targetClubId = sortedClubs[0].id;
          }

          if (targetClubId) {
            const activeGotm = await getCurrentGOTM(targetClubId);
            setGotm(activeGotm);
          }

        } catch (err) {
          console.error("Error fetching homepage data:", err);
        }
      }

      setLoading(false);
    }

    if (!authLoading) {
      initData();
    }
  }, [user, authLoading]);

  // TEMPORARY FIX: Set Karlos as Champion
  useEffect(() => {
    if (!user) return;
    const runFix = async () => {
      try {
        console.log("Running temporary fix for Karlos...");
        const { collection, query, where, getDocs, updateDoc, doc } = await import("firebase/firestore");

        // 1. Find Karlos
        const q = query(collection(db, "users"), where("displayName", "==", "Karlos"));
        const snap = await getDocs(q);
        let karlosId = null;
        let karlosName = "Karlos";

        if (!snap.empty) {
          karlosId = snap.docs[0].id;
          karlosName = snap.docs[0].data().displayName;
          console.log("Found Karlos:", karlosId);
        } else {
          console.log("Karlos not found by exact name, trying lowercase...");
          const q2 = query(collection(db, "users"), where("displayNameLowercase", "==", "karlos"));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            karlosId = snap2.docs[0].id;
            karlosName = snap2.docs[0].data().displayName;
            console.log("Found karlos (lowercase):", karlosId);
          }
        }

        // 2. Find Porkchop Xpress
        const clubsSnap = await getDocs(collection(db, "clubs"));
        let clubId = null;
        clubsSnap.forEach(d => {
          if (d.data().name?.toLowerCase().includes("porkchop")) {
            clubId = d.id;
            console.log("Found Porkchop Xpress:", clubId);
          }
        });

        if (karlosId && clubId) {
          // Update Club
          await updateDoc(doc(db, "clubs", clubId), {
            latestWinnerId: karlosId,
            latestWinnerName: karlosName
          });
          console.log("SUCCESS: Karlos set as Club Champion!");

          // Update Latest Session
          const sessionsQ = query(
            collection(db, "weekly_sessions"),
            where("clubId", "==", clubId),
            where("isActive", "==", false)
          );
          const sessionsSnap = await getDocs(sessionsQ);
          // Find most recent end date
          let latestSession: any = null;
          sessionsSnap.forEach(d => {
            const data = d.data();
            if (!latestSession || new Date(data.endDate) > new Date(latestSession.endDate)) {
              latestSession = { id: d.id, ...data };
            }
          });

          if (latestSession) {
            await updateDoc(doc(db, "weekly_sessions", latestSession.id), {
              winnerId: karlosId,
              winnerName: karlosName
            });
            console.log("SUCCESS: Updated latest session winner:", latestSession.gameTitle);
          }
        } else {
          console.log("Fix failed: Missing ID", { karlosId, clubId });
        }
      } catch (e) {
        console.error("Fix error:", e);
      }
    };
    runFix();
  }, [user]);

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
    <main className="flex-1 container mx-auto px-4 py-8 relative min-h-screen">

      {!user ? (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <AuthGate />
        </div>
      ) : (
        <>
          {/* Hero Section - Only show if user has NO clubs */}
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

          {/* YOUR CLUBS SECTION */}
          {userClubs.length > 0 ? (
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
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-white font-black text-2xl italic tracking-tight">{topScore.scoreValue.toLocaleString()}</span>
                                    <span className="text-sm text-white/50 truncate max-w-[120px]">{topScore.displayName || "Unknown"}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-4">
                              <Link href={activeSession ? `/club?id=${activeSession.clubId}` : "/profile"}>
                                <Button className="px-10 h-12 neon-border font-black uppercase italic tracking-tight text-sm">
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
                  <Link href={gotm ? `/club?id=${gotm.clubId}` : '#'}>
                    <Card className="relative overflow-hidden border-primary/20 bg-surface/40 h-full min-h-[400px] hover:border-primary/50 transition-colors group cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-black/80 z-10" />

                      {gotm?.coverUrl ? (
                        <div className="absolute inset-0 opacity-50 group-hover:scale-105 transition-transform duration-700">
                          <img src={gotm.coverUrl} className="w-full h-full object-cover" />
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
                    {/* Background Image with Opacity & Hover Effect */}
                    <div className="absolute inset-0 opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700">
                      <img
                        src="/images/retro-club-bg.png"
                        className="w-full h-full object-cover"
                        alt="Retro Video Game Cabinets"
                      />
                    </div>

                    {/* Gradient Overlays */}
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
          ) : (
            <section className="mb-12 animate-fade-in-up stagger-2 text-center py-12">
              <div className="max-w-md mx-auto space-y-8">
                <div className="bg-surface/40 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
                  <Shield className="w-16 h-16 text-primary mx-auto mb-6 opacity-50" />
                  <h3 className="text-2xl font-black text-white mb-4 italic uppercase">Your Journey Begins Here</h3>
                  <p className="text-muted-foreground mb-8">
                    To access the weekly challenges, scoreboards, and club leaderboards, you need to be part of a club community.
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    <Link href="/clubs/create">
                      <Button className="w-full neon-border h-14 text-lg font-black italic uppercase tracking-widest">
                        Create Your Club
                      </Button>
                    </Link>
                    <div className="flex items-center gap-4 py-2">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-xs text-white/20 font-bold uppercase">or</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <Link href="/clubs">
                      <Button variant="ghost" className="w-full h-14 border border-white/10 text-white font-bold hover:bg-white/10">
                        Join an Existing Club
                      </Button>
                    </Link>
                    <Link href="/search">
                      <Button variant="ghost" className="w-full h-14 border border-white/10 text-muted-foreground font-bold hover:text-blue-400 hover:bg-white/5 flex items-center justify-center gap-2">
                        <Search className="w-4 h-4 text-blue-400" /> Discover Players
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Arcade Teaser for Non-Club Users */}
                <Link href="/arcade">
                  <Card className="border-white/10 bg-gradient-to-r from-purple-900/20 to-black hover:bg-purple-900/40 transition-all cursor-pointer group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gamepad2 className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <h4 className="font-black text-white italic uppercase">Just looking to play?</h4>
                          <p className="text-xs text-muted-foreground">Visit The Arcade</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>
          )}
        </>
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
