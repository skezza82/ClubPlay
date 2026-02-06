"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GameActions } from "@/components/GameActions";
import { PremiumLogo } from "@/components/PremiumLogo";
import { UserProfile } from "@/components/UserProfile";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabase";
import { Trophy, Gamepad2, Users, Loader2, Shield, Plus, ArrowRight, Info, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getLatestClubMembership,
  getActiveSession,
  getUserClubs
} from "@/lib/firestore-service";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getLibretroBoxartUrl } from "@/lib/libretro-utils";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [game, setGame] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userClubs, setUserClubs] = useState<any[]>([]);

  useEffect(() => {
    async function initData() {
      if (user) {
        try {
          // 1. Fetch user clubs
          const clubs = await getUserClubs(user.uid);
          setUserClubs(clubs);

          // 1.5 Fetch User Profile for Last Visited
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const lastVisitedId = userDoc.exists() ? userDoc.data().lastVisitedClubId : null;

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
            if (soonestSession.gameId) {
              const { data: gameData } = await supabase.from('games').select('*').eq('id', soonestSession.gameId).single();
              if (gameData) setGame(gameData);
            } else {
              setGame({
                title: soonestSession.gameTitle,
                platform: soonestSession.platform,
                cover_image_url: soonestSession.cover_image_url || null
              });
            }
          } else {
            setGame(null);
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

  // Handle Loading State
  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center relative overflow-hidden">
        <div className="star-background"><div className="stars"></div></div>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-primary font-mono animate-pulse">Initializing Interface...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8 relative min-h-screen">
      <div className="star-background">
        <div className="stars"></div>
      </div>

      {!user ? (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <AuthGate />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="mb-16 text-center relative flex flex-col items-center animate-fade-in-up stagger-1 min-h-[20vh] justify-center">
            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter mb-4">
              Join the <span className="text-primary">Elite</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Compete with friends in weekly gaming challenges. <span className="text-primary font-bold">One Game. One Week. One Champion.</span>
            </p>
          </section>

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
                          <img src={club.logoUrl || "/images/retro-club-bg.png"} alt="" className="w-full h-full object-cover" />
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

                            <div className="flex gap-4">
                              <Link href={activeSession ? `/club?id=${activeSession.clubId}` : "/profile"}>
                                <Button className="px-8 h-12 neon-border font-black uppercase italic tracking-widest">
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

                {/* Stats / Countdown removed as per request */}
              </div>

              {/* Arcade Promo Banner */}
              <section className="mb-12 animate-fade-in-up stagger-4">
                <Link href="/arcade">
                  <Card className="border-white/10 bg-gradient-to-r from-purple-900/40 to-black hover:border-purple-500/50 transition-all cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-repeat opacity-5 pointer-events-none" style={{ backgroundImage: 'url("/images/grid-pattern.png")' }} />
                    <CardContent className="p-8 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                          <Gamepad2 className="w-8 h-8 text-purple-400 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-purple-400 transition-colors mb-2">The Arcade</h3>
                          <p className="text-muted-foreground text-lg">No Club? No Problem. Play free classic games instantly.</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="hidden md:flex items-center gap-2 text-purple-400 group-hover:text-purple-300 font-bold uppercase tracking-wider text-lg">
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
