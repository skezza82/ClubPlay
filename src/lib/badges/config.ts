import React from 'react';
import { Trophy, Star, Shield, Users, Timer, Target, Flame, Rocket, Share2, CalendarCheck } from 'lucide-react';

export type BadgeType = 'one-time' | 'stackable';

export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    type: BadgeType;
    icon: React.ElementType;
    color: string;
}

export const BADGE_REGISTRY: Record<string, BadgeDefinition> = {
    'gotm_reviewer': {
        id: 'gotm_reviewer',
        name: 'GotM Reviewer',
        description: 'Left a Game of the Month review.',
        type: 'stackable',
        icon: Star,
        color: 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]',
    },
    'social_10': {
        id: 'social_10',
        name: 'Social Butterfly',
        description: 'Made 10 Friends.',
        type: 'one-time',
        icon: Users,
        color: 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]',
    },
    'social_50': {
        id: 'social_50',
        name: 'Popular',
        description: 'Made 50 Friends.',
        type: 'one-time',
        icon: Users,
        color: 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]',
    },
    'clutch_player': {
        id: 'clutch_player',
        name: 'Clutch Player',
        description: 'Set a challenge winning score with less than 60 seconds remaining.',
        type: 'stackable',
        icon: Timer,
        color: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]',
    },
    'club_leader': {
        id: 'club_leader',
        name: 'Club Leader',
        description: 'Became an Admin for a club.',
        type: 'one-time',
        icon: Shield,
        color: 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]',
    },
    'dedicated_gamer_5': {
        id: 'dedicated_gamer_5',
        name: 'Dedicated Gamer',
        description: 'Took part in 5 challenges back to back.',
        type: 'one-time',
        icon: Target,
        color: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    },
    'dedicated_gamer_10': {
        id: 'dedicated_gamer_10',
        name: 'Relentless Challenger',
        description: 'Took part in 10 challenges back to back.',
        type: 'one-time',
        icon: Target,
        color: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
    },
    'challenge_win': {
        id: 'challenge_win',
        name: 'Champion',
        description: 'Won a weekly challenge.',
        type: 'stackable',
        icon: Trophy,
        color: 'text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.8)]',
    },
    'challenge_streak_5': {
        id: 'challenge_streak_5',
        name: 'Unstoppable',
        description: 'Won 5 weekly challenges in a row.',
        type: 'one-time',
        icon: Flame,
        color: 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]',
    },
    'club_hopper_5': {
        id: 'club_hopper_5',
        name: 'Club Hopper',
        description: 'Joined 5 or more clubs.',
        type: 'one-time',
        icon: Shield,
        color: 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]',
    },
    'og_member': {
        id: 'og_member',
        name: 'OG Member',
        description: 'One of the first 100 members of ClubPlay.',
        type: 'one-time',
        icon: Star,
        color: 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    },
    'beta_tester': {
        id: 'beta_tester',
        name: 'Beta Tester',
        description: 'Participated in the early beta stages of ClubPlay.',
        type: 'one-time',
        icon: Rocket,
        color: 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]',
    },
    'sharing_is_caring': {
        id: 'sharing_is_caring',
        name: 'Sharing is Caring',
        description: 'Shared a club with others to grow the community.',
        type: 'one-time',
        icon: Share2,
        color: 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]',
    },
    'daily_5_streak': {
        id: 'daily_5_streak',
        name: 'Dedicated Member',
        description: 'Logged in for 5 consecutive days.',
        type: 'one-time',
        icon: CalendarCheck,
        color: 'text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]',
    }
};
