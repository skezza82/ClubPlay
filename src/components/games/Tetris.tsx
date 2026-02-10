"use client";

import React, { useState } from 'react';
import { createStage, checkCollision } from './useTetris';
import { useInterval } from '@/hooks/useInterval';
import { usePlayer } from './useTetris';
import { useStage } from './useTetris';
import { useGameStatus } from './useTetris';
import { ScoreSubmission } from '../arcade/ScoreSubmission';
import { Button } from '@/components/ui/Button';
import { Play, RotateCcw } from 'lucide-react';

const StyledStage = ({ stage }: { stage: any[][] }) => (
    <div className="grid grid-rows-[repeat(20,minmax(0,1fr))] grid-cols-[repeat(10,minmax(0,1fr))] gap-[1px] border-2 border-[#333] bg-[#111] mx-auto relative group shadow-2xl shadow-purple-900/20 aspect-[10/20] h-[60vh] w-auto md:h-auto md:w-full md:max-w-[20rem]">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 pointer-events-none" />
        {stage.map((row) => row.map((cell: any[], x: number) => <Cell key={x} type={cell[0]} />))}
    </div>
);

const Cell = ({ type }: { type: 0 | string }) => {
    // Colors matching useTetris/tetrominos.ts
    const colors: Record<string, string> = {
        0: 'bg-transparent',
        I: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
        J: 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]',
        L: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]',
        O: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]',
        S: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]',
        T: 'bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]',
        Z: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    };

    return (
        <div className={`w-full h-full ${type !== 0 ? colors[type as keyof typeof colors] : 'bg-[#000]/80'} border border-white/5 rounded-[1px]`} />
    );
};

interface TetrisProps {
    onGameOver: (score: number) => void;
}

export default function Tetris({ onGameOver }: TetrisProps) {
    const [dropTime, setDropTime] = useState<null | number>(null);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const { player, updatePlayerPos, resetPlayer, playerRotate, setPlayer } = usePlayer();
    const { stage, setStage, rowsCleared } = useStage(player, resetPlayer);
    const { score, setScore, rows, setRows, level, setLevel } = useGameStatus(rowsCleared);

    const movePlayer = (dir: number) => {
        if (!checkCollision(player, stage, { x: dir, y: 0 })) {
            updatePlayerPos({ x: dir, y: 0, collided: false });
        }
    };

    const startGame = () => {
        // Reset everything
        setStage(createStage());
        setDropTime(1000);
        resetPlayer();
        setGameOver(false);
        setScore(0);
        setRows(0);
        setLevel(0);
        setGameStarted(true);
    };

    const drop = () => {
        // Increase level when player has cleared 10 rows
        if (rows > (level + 1) * 10) {
            setLevel((prev) => prev + 1);
            // Also increase speed
            setDropTime(1000 / (level + 1) + 200);
        }

        if (!checkCollision(player, stage, { x: 0, y: 1 })) {
            updatePlayerPos({ x: 0, y: 1, collided: false });
        } else {
            // Game Over
            if (player.pos.y < 1) {
                setGameOver(true);
                setDropTime(null);
                setGameStarted(false);
                onGameOver(score); // Notify parent/ScoreSubmission
            }
            updatePlayerPos({ x: 0, y: 0, collided: true });
        }
    };

    const keyUp = ({ keyCode }: { keyCode: number }) => {
        if (!gameOver) {
            // Activate the interval again when user releases down arrow
            if (keyCode === 40) {
                setDropTime(1000 / (level + 1) + 200);
            }
        }
    };

    const move = ({ keyCode }: { keyCode: number }) => {
        if (!gameOver) {
            if (keyCode === 37) { // Left
                movePlayer(-1);
            } else if (keyCode === 39) { // Right
                movePlayer(1);
            } else if (keyCode === 40) { // Down
                setDropTime(null); // Pause interval to avoid double drop
                drop();
            } else if (keyCode === 38) { // Up (Rotate)
                playerRotate(stage, 1);
            }
        }
    };

    useInterval(() => {
        drop();
    }, dropTime);

    return (
        <div
            className="w-full flex flex-col items-center outline-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => move(e)}
            onKeyUp={keyUp}
            id="tetris-wrapper"
            autoFocus
        >
            <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-start justify-center">
                {/* Stage */}
                <div className="relative w-full md:w-auto">
                    <StyledStage stage={stage} />

                    {/* Overlays */}
                    {gameOver && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                            <ScoreSubmission
                                score={score}
                                gameId="tetris"
                                onPlayAgain={startGame}
                                onScoreSubmitted={() => { }} // Leaderboard updates automatically via parent re-render usually, but handled by HighScores component
                            />
                        </div>
                    )}

                    {!gameStarted && !gameOver && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                            <Button onClick={startGame} className="h-16 px-8 font-black text-2xl uppercase tracking-widest animate-pulse scale-110">
                                <Play className="w-8 h-8 mr-3" /> Insert Coin
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile Controls */}
                <div className="grid grid-cols-3 gap-1 w-full max-w-[180px] md:hidden mt-2">
                    <div />
                    <Button
                        variant="secondary"
                        size="icon"
                        className="w-12 h-12 rounded-full bg-white/10 active:bg-primary/50 touch-manipulation"
                        onPointerDown={(e) => { e.preventDefault(); move({ keyCode: 38 }); }}
                    >
                        <RotateCcw className="w-5 h-5" />
                    </Button>
                    <div />

                    <Button
                        variant="secondary"
                        size="icon"
                        className="w-12 h-12 rounded-full bg-white/10 active:bg-primary/50 touch-manipulation"
                        onPointerDown={(e) => { e.preventDefault(); move({ keyCode: 37 }); }}
                    >
                        <span className="text-xl font-bold">←</span>
                    </Button>

                    <Button
                        variant="secondary"
                        size="icon"
                        className="w-12 h-12 rounded-full bg-white/10 active:bg-primary/50 touch-manipulation"
                        onPointerDown={(e) => { e.preventDefault(); move({ keyCode: 40 }); }}
                        onPointerUp={(e) => { e.preventDefault(); keyUp({ keyCode: 40 }); }}
                        onPointerLeave={(e) => { e.preventDefault(); keyUp({ keyCode: 40 }); }}
                    >
                        <span className="text-xl font-bold">↓</span>
                    </Button>

                    <Button
                        variant="secondary"
                        size="icon"
                        className="w-12 h-12 rounded-full bg-white/10 active:bg-primary/50 touch-manipulation"
                        onPointerDown={(e) => { e.preventDefault(); move({ keyCode: 39 }); }}
                    >
                        <span className="text-xl font-bold">→</span>
                    </Button>
                </div>

                {/* Sidebar */}
                <div className="w-full md:w-64 flex flex-col gap-4">
                    <div className="bg-surface/50 p-6 rounded-xl border border-white/10 space-y-4">
                        <div>
                            <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-1">Score</p>
                            <p className="text-3xl font-mono text-white font-bold">{score.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-1">Level</p>
                            <p className="text-xl font-mono text-white font-bold">{level}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-1">Rows</p>
                            <p className="text-xl font-mono text-white font-bold">{rows}</p>
                        </div>
                    </div>

                    <div className="bg-surface/30 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">Controls</p>
                        <ul className="text-sm space-y-1 text-gray-400">
                            <li className="flex justify-between"><span>Rotate</span> <kbd className="bg-black/50 px-1 rounded">↑</kbd></li>
                            <li className="flex justify-between"><span>Move</span> <kbd className="bg-black/50 px-1 rounded">← →</kbd></li>
                            <li className="flex justify-between"><span>Drop</span> <kbd className="bg-black/50 px-1 rounded">↓</kbd></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
