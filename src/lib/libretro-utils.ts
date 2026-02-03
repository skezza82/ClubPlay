/**
 * Mapping of common system nicknames to official Libretro thumbnail repository folder names.
 */
const SYSTEM_MAP: Record<string, string> = {
    "nes": "Nintendo - Nintendo Entertainment System",
    "snes": "Nintendo - Super Nintendo Entertainment System",
    "sfc": "Nintendo - Super Nintendo Entertainment System",
    "genesis": "Sega - Mega Drive - Genesis",
    "megadrive": "Sega - Mega Drive - Genesis",
    "master system": "Sega - Master System - Mark III",
    "game gear": "Sega - Game Gear",
    "gb": "Nintendo - Game Boy",
    "gameboy": "Nintendo - Game Boy",
    "gbc": "Nintendo - Game Boy Color",
    "gameboy color": "Nintendo - Game Boy Color",
    "gba": "Nintendo - Game Boy Advance",
    "gameboy advance": "Nintendo - Game Boy Advance",
    "n64": "Nintendo - Nintendo 64",
    "ps1": "Sony - PlayStation",
    "playstation": "Sony - PlayStation",
    "psp": "Sony - PlayStation Portable",
    "saturn": "Sega - Saturn",
    "dreamcast": "Sega - Dreamcast",
    "gamecube": "Nintendo - GameCube",
    "wii": "Nintendo - Wii",
    "ds": "Nintendo - Nintendo DS",
    "3ds": "Nintendo - Nintendo 3DS",
    "pc engine": "NEC - PC Engine - TurboGrafx 16",
    "turbografx": "NEC - PC Engine - TurboGrafx 16",
    "arcade": "MAME",
    "mame": "MAME",
    "neogeo": "SNK - Neo Geo",
    "atari 2600": "Atari - 2600",
    "atari 7800": "Atari - 7800",
    "lynx": "Atari - Lynx",
};

/**
 * Sanitizes a game title for use in the Libretro thumbnails repository.
 * libretro-thumbnails uses '_' for characters that are invalid in file names like &, *, /, :, <, >, ?, \, |, "
 */
export function sanitizeLibretroTitle(title: string): string {
    return title.replace(/[&*/:<>?\\|"]/g, '_');
}

/**
 * Generates a Libretro thumbnail URL for a given game and system.
 * @param title The name of the game (e.g., "Super Mario World (USA)")
 * @param system The nickname or full name of the system (e.g., "SNES" or "Nintendo - Super Nintendo Entertainment System")
 * @returns The direct URL to the boxart thumbnail on GitHub
 */
export function getLibretroBoxartUrl(title: string, system: string): string {
    if (!title || !system) return "";

    const normalizedSystem = system.toLowerCase();
    const folderName = SYSTEM_MAP[normalizedSystem] || system;
    const sanitizedTitle = sanitizeLibretroTitle(title);

    // Using raw.githubusercontent.com for direct image access
    return `https://raw.githubusercontent.com/libretro-thumbnails/libretro-thumbnails/master/${encodeURIComponent(folderName)}/Named_Boxarts/${encodeURIComponent(sanitizedTitle)}.png`;
}

export const PLACEHOLDER_BOXART_URL = "/images/challenge-placeholder.png";
