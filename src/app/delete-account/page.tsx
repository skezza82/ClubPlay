"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertTriangle, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { deleteUserAccount } from "@/lib/firestore-service";
import { deleteUser, reauthenticateWithPopup, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Import auth instance
import { useRouter } from "next/navigation";

export default function DeleteAccountPage() {
    const { user, loginWithGoogle } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleDelete = async () => {
        if (!user) return;

        if (!confirm("Are you absolutely sure? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        setError("");

        try {
            // 1. Clean up Firestore data
            await deleteUserAccount(user.uid);

            // 2. Delete Authentication Record
            // Note: Requires recent login. We might need to handle re-auth.
            try {
                await deleteUser(user);
            } catch (authError: any) {
                if (authError.code === 'auth/requires-recent-login') {
                    // Prompt for re-auth (Simple version: Ask them to sign in again)
                    setError("Security requires you to sign in again before deleting. Please sign out and sign back in, then return to this page.");
                    setIsDeleting(false);
                    return;
                }
                throw authError;
            }

            // 3. Redirect to home (AuthContext will detect null user)
            router.push("/");
        } catch (err: any) {
            console.error("Deletion failed:", err);
            setError("Failed to delete account: " + err.message);
            setIsDeleting(false);
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-lg min-h-screen flex flex-col justify-center">
            <Link href="/profile" className="flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors group self-start">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Cancel & Go Back
            </Link>

            <Card className="border-red-500/30 bg-red-950/10 backdrop-blur-md">
                <CardHeader className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl font-black text-center text-red-500 uppercase tracking-widest">
                        Delete Account
                    </CardTitle>
                    <CardDescription className="text-center text-lg">
                        <span className="font-bold text-white">ClubPlay</span> Account Deletion
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!user ? (
                        <div className="text-center space-y-6">
                            <p className="text-muted-foreground">
                                To request account deletion, you must first verify your identity by signing in.
                            </p>
                            <Button
                                onClick={() => loginWithGoogle()} // Use generic login or link to /login
                                className="w-full neon-border"
                            >
                                Sign In to Delete Account
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg space-y-2">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-red-400 text-sm uppercase">Permanently Delete Data?</h4>
                                        <p className="text-xs text-red-200/70 leading-relaxed">
                                            This action is <strong>irreversible</strong>.
                                        </p>
                                    </div>
                                </div>
                                <ul className="list-disc list-inside text-xs text-red-200/70 pl-8 space-y-1">
                                    <li>Your user profile and display name</li>
                                    <li>Your login credentials (Email/Google)</li>
                                    <li>All club memberships</li>
                                    <li>All submitted high scores and times</li>
                                </ul>
                                <p className="text-xs font-bold text-red-400 mt-2 pl-8">
                                    No data will be retained.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4 pt-4">
                                <p className="text-sm text-center text-muted-foreground">
                                    Signed in as: <strong className="text-white">{user.email}</strong>
                                </p>
                                <Button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white border-red-500 font-bold h-12"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Permanently Delete My Account"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
