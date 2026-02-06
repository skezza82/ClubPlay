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

import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0B0C10", // Match background color
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ClubPlay | Competitive Gaming Clubs",
  description: "Join a club, play the game of the week, and climb the club leaderboard.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClubPlay",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import { PWAProvider } from "@/context/PWAContext";
import { PWARegistrar } from "@/components/PWARegistrar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Navbar } from "@/components/Navbar";
import { AndroidBackHandler } from "@/components/AndroidBackHandler";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPrompt = e;
                console.log("Captured PWA prompt early");
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <PWAProvider>
            <PWARegistrar />
            <InstallPrompt />
            <AndroidBackHandler />
            <Navbar />
            {children}
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
