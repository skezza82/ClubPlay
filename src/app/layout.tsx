import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClubPlay | Competitive Gaming Clubs",
  description: "Join a club, play the game of the week, and climb the season leaderboard.",
  manifest: "/manifest.json",
  themeColor: "#66fcf1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClubPlay",
  },
  icons: {
    apple: "/icon.png",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import { PWARegistrar } from "@/components/PWARegistrar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Navbar } from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <PWARegistrar />
          <InstallPrompt />
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
