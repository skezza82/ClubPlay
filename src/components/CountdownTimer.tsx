"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function CountdownTimer({ targetDate }: { targetDate?: string }) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

    const calculateTimeLeft = () => {
        const now = new Date();
        let target: Date;

        if (targetDate) {
            target = new Date(targetDate);
        } else {
            // Default target: Next Sunday @ Midnight
            target = new Date(now);
            const day = target.getDay(); // 0 is Sunday
            const diff = day === 0 ? 7 : 7 - day;
            target.setDate(target.getDate() + diff);
            target.setHours(0, 0, 0, 0);
        }

        const difference = target.getTime() - now.getTime();

        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return null;
    };

    useEffect(() => {
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!timeLeft) return <div className="animate-pulse">Calculating...</div>;

    return (
        <div className="flex gap-4 font-mono">
            <TimeUnit value={timeLeft.days} label="d" />
            <TimeUnit value={timeLeft.hours} label="h" />
            <TimeUnit value={timeLeft.minutes} label="m" />
            <TimeUnit value={timeLeft.seconds} label="s" />
        </div>
    );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex items-baseline gap-1">
            <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                {value.toString().padStart(2, '0')}
            </span>
            <span className="text-primary font-bold text-xs uppercase opacity-70">{label}</span>
        </div>
    );
}
