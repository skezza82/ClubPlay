
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PremiumLogo } from "@/components/PremiumLogo";
import { Users, Search, PlusCircle, ArrowUpDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ClubsPage() {
    const [clubs, setClubs] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "count">("count");
    const { user } = useAuth();

    useEffect(() => {
        const fetchClubs = async () => {
            const { data } = await supabase.from('clubs').select('*');
            if (data) setClubs(data);
        };
        fetchClubs();
    }, []);

    const filteredClubs = clubs
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "count") return b.member_count - a.member_count;
            return a.name.localeCompare(b.name);
        });

    const handleJoinRequest = async (clubId: string) => {
        if (!user) {
            alert("Please sign in to join a club!");
            return;
        }

        const { error } = await supabase.from('join_requests').insert({
            club_id: clubId,
            user_id: user.id,
            status: 'pending'
        });

        if (!error) {
            alert("Join request sent!");
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-float">
                <div className="flex flex-col gap-2">
                    <PremiumLogo />
                    <p className="text-muted-foreground ml-1">Find your next gaming community</p>
                </div>

                <Link href="/clubs/create">
                    <Button variant="default" className="neon-border group font-bold">
                        <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                        Create New Club
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search clubs by name..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    className="backdrop-blur-sm border-white/10"
                    onClick={() => setSortBy(sortBy === "count" ? "name" : "count")}
                >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Sort by: {sortBy === "count" ? "Members" : "Name"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClubs.map((club) => (
                    <Card key={club.id} className="group hover:scale-[1.02] transition-all duration-300 border-white/5 hover:border-primary/40 bg-surface/40 overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="mb-2 bg-primary/20 text-primary border-primary/30 uppercase text-[10px] tracking-widest font-bold px-2 py-0.5 rounded">
                                        ID: {club.invite_code}
                                    </Badge>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{club.name}</CardTitle>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 text-muted-foreground text-xs font-mono">
                                    <Users className="w-3 h-3" />
                                    {club.member_count}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="mb-6 line-clamp-2">
                                Competitive club for serious gamers. Join us for the next Game of the Week!
                            </CardDescription>

                            <Button
                                className="w-full glass-button font-bold text-shadow-sm"
                                onClick={() => handleJoinRequest(club.id)}
                            >
                                Request to Join
                                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredClubs.length === 0 && (
                <div className="text-center py-20">
                    <Users className="w-16 h-16 mx-auto mb-4 text-white/10" />
                    <h3 className="text-xl font-bold text-white/50">No clubs found matching your search.</h3>
                    <p className="text-muted-foreground mt-2">Try a different keyword or create your own club!</p>
                </div>
            )}
        </main>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
            {children}
        </span>
    );
}
