import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SUGGESTED_GAMES } from '@/lib/suggested-games';

interface Game {
    id: number;
    name: string;
    coverUrl: string | null;
    releaseDate?: number;
    platforms?: string;
}

interface GameSearchProps {
    onSelect: (game: Game) => void;
    className?: string;
}

export function GameSearch({ onSelect, className = '' }: GameSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setIsOpen(true);
        setResults([]);

        try {
            // Priority 1: Cloud Function (for production/APK)
            // Priority 2: Next.js API Route (for local dev)
            const cloudFunctionUrl = process.env.NEXT_PUBLIC_FUNCTIONS_URL; // e.g. https://us-central1-....cloudfunctions.net/searchGames
            const localApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/games/search` : '/api/games/search';

            const targetUrl = cloudFunctionUrl || localApiUrl;

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data.games || []);
            } else {
                throw new Error(`API error: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Search failed:', error);
            // Fallback to filtering suggested games
            const fallback = SUGGESTED_GAMES.filter(g => g.name.toLowerCase().includes(query.toLowerCase()));
            setResults(fallback);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className={`relative w-full max-w-md ${className}`} ref={wrapperRef}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for a game..."
                        className="pr-10"
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                    )}
                </div>
                <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
                    <Search className="h-4 w-4" />
                </Button>
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-10 mt-2 w-full max-h-80 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
                    <div className="p-2 space-y-1">
                        {results.map((game) => (
                            <button
                                key={game.id}
                                onClick={() => {
                                    onSelect(game);
                                    setIsOpen(false);
                                    setQuery('');
                                }}
                                className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-gray-800 transition-colors text-left"
                            >
                                <div className="h-12 w-9 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                                    {game.coverUrl ? (
                                        <img
                                            src={game.coverUrl}
                                            alt={game.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                                            No img
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-100 line-clamp-1">{game.name}</div>
                                    <div className="text-xs text-gray-400 flex flex-col">
                                        {game.releaseDate && (
                                            <span>{new Date(game.releaseDate * 1000).getFullYear()}</span>
                                        )}
                                        {game.platforms && (
                                            <span className="text-primary/70 line-clamp-1">{game.platforms}</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && !isLoading && query && results.length === 0 && (
                <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-xl">
                    <p className="text-center text-gray-400 mb-3">No games found via API.</p>
                    <div className="pt-2 border-t border-gray-800">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Suggested Classics</p>
                        <div className="space-y-1">
                            {SUGGESTED_GAMES.slice(0, 3).map(game => (
                                <button
                                    key={game.id}
                                    onClick={() => {
                                        onSelect({ ...game, id: game.id, releaseDate: game.releaseDate });
                                        setIsOpen(false);
                                        setQuery('');
                                    }}
                                    className="w-full text-left text-sm text-primary hover:underline py-1"
                                >
                                    {game.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Show suggestions if query is empty and user focused */}
            {isOpen && !query && (
                <div className="absolute z-10 mt-2 w-full max-h-80 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl p-2">
                    <p className="text-xs text-gray-500 uppercase font-bold px-2 py-1 mb-1">Popular Games</p>
                    {SUGGESTED_GAMES.map((game) => (
                        <button
                            key={game.id}
                            onClick={() => {
                                onSelect({ ...game, id: game.id, releaseDate: game.releaseDate });
                                setIsOpen(false);
                                setQuery('');
                            }}
                            className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-gray-800 transition-colors text-left"
                        >
                            <div className="h-8 w-6 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                                <img src={game.coverUrl} alt={game.name} className="h-full w-full object-cover" />
                            </div>
                            <span className="text-sm font-medium text-gray-300">{game.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
