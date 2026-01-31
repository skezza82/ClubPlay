
import { Gamepad2 } from "lucide-react";

export function PremiumLogo() {
    return (
        <div className="relative inline-flex items-center gap-3 group">
            <div className="relative">
                <div className="absolute inset-0 bg-primary blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-pulse" />
                <Gamepad2 className="w-12 h-12 text-white relative z-10 drop-shadow-[0_0_10px_rgba(102,252,241,0.8)]" />
            </div>

            <div className="flex flex-col items-start">
                <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    CLUB<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 group-hover:to-primary transition-all duration-300">PLAY</span>
                </h1>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-primary-dim/80 group-hover:text-primary transition-colors">
                    Competitive League
                </span>
            </div>
        </div>
    );
}
