"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
    return (
        <main className="container mx-auto px-4 py-8 max-w-3xl">
            <Link href="/" className="flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </Link>

            <Card className="border-white/10 bg-surface/40 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-center">
                        Privacy <span className="text-primary">Policy</span>
                    </CardTitle>
                    <p className="text-center text-muted-foreground text-sm">
                        Effective Date: February 9, 2026
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 text-white/80 leading-relaxed">
                    <section className="space-y-2">
                        <p>
                            <strong>ClubPlay</strong> ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by ClubPlay.
                        </p>
                        <p>
                            By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold text-primary">1. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Personal Information:</strong> When you register, we collect your Email Address (via Google Sign-In) and Display Name. You may voluntarily upload a Profile Picture.</li>
                            <li><strong>Usage Data:</strong> We track club memberships, game participation, and scores to provide the service.</li>
                            <li><strong>Device Information:</strong> We may collect device model and OS version for analytics and troubleshooting.</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold text-primary">2. How We Use Your Information</h2>
                        <p>We use the information to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Provide and maintain the Service (managing accounts, clubs, leaderboards).</li>
                            <li>Improve functionality and user experience.</li>
                            <li>Show personalized advertisements via Google AdMob.</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold text-primary">3. Third-Party Services</h2>
                        <p>We use the following third-party services:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Google Firebase:</strong> Authentication, Hosting, and Database.</li>
                            <li><strong>Google AdMob:</strong> Advertising.</li>
                            <li><strong>IGDB:</strong> Game metadata (No personal data shared).</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold text-primary">4. Data Retention and Deletion</h2>
                        <p>
                            We retain data only as long as necessary. You have the right to request deletion of your account and all associated data at any time.
                        </p>
                        <p>
                            <strong>To Delete Your Data:</strong>
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>In App: Go to <strong>Profile &gt; Delete Account</strong>.</li>
                            <li>Web: Visit our <Link href="/delete-account" className="text-primary underline">Deletion Request Page</Link>.</li>
                        </ul>
                        <p className="text-sm italic text-muted-foreground mt-2">
                            Upon confirmation, all profile data, authentication records, memberships, and scores are permanently deleted immediately.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-xl font-bold text-primary">5. Contact Us</h2>
                        <p>
                            If you have questions about this Privacy Policy, please contact the developer via the app support options on the Google Play Store.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </main>
    );
}
