import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Game {
    id: number;
    name: string;
    coverUrl: string | null;
    releaseDate?: number;
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
            const response = await fetch('/api/games/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data.games || []);
            }
        } catch (error) {
            console.error('Search failed:', error);
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
                                    {game.releaseDate && (
                                        <div className="text-xs text-gray-400">
                                            {new Date(game.releaseDate * 1000).getFullYear()}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && !isLoading && query && results.length === 0 && (
                <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 p-4 text-center text-gray-400 shadow-xl">
                    No games found
                </div>
            )}
        </div>
    );
}
