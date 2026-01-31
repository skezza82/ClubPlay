
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PremiumLogo } from "@/components/PremiumLogo";
import { Users, Settings, Gamepad2, Check, X, Trophy, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";

export default function ClubAdminPage() {
    const { id: clubId } = useParams();
    const [club, setClub] = useState<any>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"requests" | "game" | "members">("requests");
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchAdminData = async () => {
            // Verify admin status (mock check)
            const { data: member } = await supabase.from('club_members')
                .select('*')
                .eq('club_id', clubId)
                .eq('user_id', user?.id)
                .single();

            if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
                // alert("Access Denied: Admins Only");
                // router.push("/clubs");
                // return;
            }

            const { data: clubData } = await supabase.from('clubs').select('*').eq('id', clubId).single();
            if (clubData) setClub(clubData);

            const { data: reqData } = await supabase.from('join_requests')
                .select('*')
                .eq('club_id', clubId)
                .eq('status', 'pending');
            if (reqData) setRequests(reqData);
        };

        if (user && clubId) fetchAdminData();
    }, [clubId, user]);

    const handleAction = async (requestId: string, action: 'accepted' | 'rejected') => {
        const { error } = await supabase.from('join_requests').update({ status: action }).eq('id', requestId);
        if (!error) {
            setRequests(requests.filter(r => r.id !== requestId));
            if (action === 'accepted') {
                // Add to members in real app
                alert("Request Accepted!");
            }
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <PremiumLogo />
                    <div className="h-10 w-px bg-white/10 hidden md:block" />
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                            Admin <span className="text-primary">Dashboard</span>
                        </h2>
                        <p className="text-muted-foreground text-sm">Managing: {club?.name || "Loading..."}</p>
                    </div>
                </div>

                <div className="flex bg-surface/50 p-1 rounded-xl border border-white/5">
                    <TabButton active={activeTab === "requests"} onClick={() => setActiveTab("requests")}>Requests</TabButton>
                    <TabButton active={activeTab === "game"} onClick={() => setActiveTab("game")}>Game Controller</TabButton>
                    <TabButton active={activeTab === "members"} onClick={() => setActiveTab("members")}>Members</TabButton>
                </div>
            </div>

            {activeTab === "requests" && (
                <div className="grid gap-6">
                    <Card className="border-primary/20 bg-surface/40 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Pending Join Requests
                            </CardTitle>
                            <CardDescription>Approve or deny new members wanting to join your club.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {requests.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">No pending requests at the moment.</div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map((req) => (
                                        <div key={req.id} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">User ID: {req.user_id}</p>
                                                    <p className="text-xs text-muted-foreground">Requested {new Date(req.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="default" className="bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/40" onClick={() => handleAction(req.id, 'accepted')}>
                                                    <Check className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => handleAction(req.id, 'rejected')}>
                                                    <X className="w-4 h-4 mr-1" /> Deny
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === "game" && (
                <Card className="border-purple-500/20 bg-surface/40 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gamepad2 className="w-5 h-5 text-purple-400" />
                            Game of the Week Controller
                        </CardTitle>
                        <CardDescription>Admins can manually set the game or trigger a reroll.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-6 rounded-xl border border-purple-500/20 bg-purple-500/5">
                            <h4 className="font-bold text-white mb-4">Current Active Game: <span className="text-purple-400">Tetris Effect</span></h4>
                            <div className="flex gap-4">
                                <Button className="glass-button border-purple-500/30 text-purple-200">Reroll Random Game</Button>
                                <Button variant="outline" className="border-white/10">Select Manual Game</Button>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground bg-white/5 p-4 rounded-lg italic">
                            Tip: Changing the game mid-week will clear current session scores.
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === "members" && (
                <Card className="border-blue-500/20 bg-surface/40 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                            Member Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Manage roles and permissions for your club members.</p>
                        <div className="mt-6 flex flex-col gap-2 opacity-50 italic">
                            Member list loading... (Mock data coming soon)
                        </div>
                    </CardContent>
                </Card>
            )}
        </main>
    );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${active ? 'bg-primary text-black shadow-[0_0_15px_rgba(102,252,241,0.5)]' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
        >
            {children}
        </button>
    );
}
