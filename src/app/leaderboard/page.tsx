
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PremiumLogo } from "@/components/PremiumLogo";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
    const mockLeaderboard = [
        { rank: 1, user: "skezz_gamer", points: 15400, trend: "up" },
        { rank: 2, user: "pro_player_99", points: 12000, trend: "down" },
        { rank: 3, user: "casual_jim", points: 8500, trend: "same" },
        { rank: 4, user: "guest_user", points: 4200, trend: "up" },
    ];

    return (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
                <PremiumLogo />
                <h2 className="text-3xl font-bold text-white">Season Standings</h2>
            </div>

            <Card className="border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-500">
                        <Trophy className="w-6 h-6" /> Top Players
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {mockLeaderboard.map((entry) => (
                            <div key={entry.rank} className="flex items-center justify-between p-4 rounded-lg bg-surface/50 border border-white/5 hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-black border-2 ${entry.rank === 1 ? 'bg-yellow-400 border-yellow-200' : 'bg-surface border-white/20 text-white'}`}>
                                        {entry.rank}
                                    </div>
                                    <span className="font-bold text-lg text-white">{entry.user}</span>
                                </div>
                                <div className="font-mono text-primary text-xl">
                                    {entry.points.toLocaleString()} pts
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
