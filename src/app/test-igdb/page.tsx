"use client";

import { useState } from "react";
import { GameSearch } from "@/components/GameSearch";

export default function TestIGDBPage() {
    const [selectedGame, setSelectedGame] = useState<any>(null);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold mb-8">IGDB Integration Test</h1>

            <div className="max-w-xl mx-auto space-y-8">
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-400">Search for a Game</h2>
                    <GameSearch
                        onSelect={(game) => setSelectedGame(game)}
                        className="w-full"
                    />
                </section>

                {selectedGame && (
                    <section className="p-6 bg-gray-900 rounded-xl border border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-semibold mb-4 text-green-400">Selected Game</h2>
                        <div className="flex gap-6">
                            <div className="w-32 h-44 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                                {selectedGame.coverUrl ? (
                                    <img
                                        src={selectedGame.coverUrl}
                                        alt={selectedGame.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                        No Cover
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">{selectedGame.name}</h3>
                                <p className="text-sm text-gray-400">ID: {selectedGame.id}</p>
                                {selectedGame.releaseDate && (
                                    <p className="text-sm text-gray-400">
                                        Release Date: {new Date(selectedGame.releaseDate * 1000).toLocaleDateString()}
                                    </p>
                                )}
                                <div className="mt-4 pt-4 border-t border-gray-800">
                                    <p className="text-xs font-mono break-all text-gray-600">
                                        Cover URL: {selectedGame.coverUrl}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
