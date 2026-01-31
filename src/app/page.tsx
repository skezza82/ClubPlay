
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GameActions } from "@/components/GameActions";
import { PremiumLogo } from "@/components/PremiumLogo";
import { UserProfile } from "@/components/UserProfile";
import { supabase } from "@/lib/supabase";
import { Trophy, Timer, Upload, Users, Gamepad2, PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  // Fetch active session and game
  const { data: sessions } = await supabase.from('weekly_sessions').select('*').eq('is_active', true).single();

  let game = null;
  if (sessions) {
    const { data: gameData } = await supabase.from('games').select('*').eq('id', sessions.game_id).single();
    game = gameData;
  }

  // Mock checking time remaining (hardcoded for now based on mock)
  const daysLeft = 3;

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <section className="mb-16 text-center animate-float relative">
        <div className="absolute top-0 right-0">
          <UserProfile />
        </div>
        <PremiumLogo />
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-6">
          Compete with friends in weekly gaming challenges. <span className="text-primary font-bold">One Game. One Week. One Champion.</span>
        </p>
      </section>

      {/* Game of the Week Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card className="md:col-span-2 relative overflow-hidden border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10" />
          {game?.cover_image_url && (
            <div className="absolute inset-0 opacity-40">
              <Image
                src={game.cover_image_url}
                alt={game.title}
                fill
                className="object-cover object-center"
              />
            </div>
          )}

          <div className="relative z-20 p-8 h-full flex flex-col justify-end min-h-[300px]">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2 border border-primary/30">
                Game of the Week
              </span>
              <h2 className="text-5xl font-black text-white mb-2 drop-shadow-lg">{game ? game.title : "Loading..."}</h2>
              <p className="text-white/80 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                {game ? game.platform : "Platform TBD"}
              </p>
            </div>

            <GameActions />
          </div>
        </Card>

        {/* Stats / Countdown */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Timer className="w-6 h-6" /> Time Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-mono font-bold text-white tracking-widest">
                {daysLeft}d 12h
              </div>
              <p className="text-sm text-muted-foreground mt-2">Challenge resets Sunday @ Midnight</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" /> Current Leader
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center font-bold text-black border-2 border-white/20">
                  1st
                </div>
                <div>
                  <p className="font-bold text-lg text-white">skezz_gamer</p>
                  <p className="text-primary font-mono">15,400 pts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/clubs" className="contents">
          <Button variant="ghost" className="h-auto py-6 flex flex-col gap-2 border border-white/5 hover:border-primary/50 bg-surface/50 cursor-pointer">
            <Users className="w-8 h-8 text-primary" />
            <span>Find a Club</span>
          </Button>
        </Link>
        <Link href="/leaderboard" className="contents">
          <Button variant="ghost" className="h-auto py-6 flex flex-col gap-2 border border-white/5 hover:border-primary/50 bg-surface/50 cursor-pointer">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <span>Leaderboards</span>
          </Button>
        </Link>
      </div>
    </main>
  );
}
