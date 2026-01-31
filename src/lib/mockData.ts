
// Mock Data for ClubPlay
export const MOCK_USERS = [
    { id: 'user-1', username: 'skezz_gamer', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=skezz' },
    { id: 'user-2', username: 'pro_player_99', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro' },
    { id: 'user-3', username: 'casual_jim', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jim' },
    { id: 'user-4', username: 'new_challenger', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=new' },
];

export const MOCK_GAMES = [
    { id: 'game-1', title: 'TETRIS', platform: 'GAMEBOY', cover_image_url: '/images/tetris.jpg' },
    { id: 'game-2', title: 'Hades', platform: 'PC/Switch', cover_image_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg' },
    { id: 'game-3', title: 'Rocket League', platform: 'Multi', cover_image_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5w0w.jpg' },
];

export const MOCK_CLUBS = [
    { id: 'club-0', name: 'The Porckchop Xpress', invite_code: 'PORK', owner_id: 'user-1', created_at: new Date().toISOString(), member_count: 88 },
    { id: 'club-1', name: 'Weekend Warriors', invite_code: 'WKND', owner_id: 'user-2', created_at: new Date().toISOString(), member_count: 3 },
    { id: 'club-2', name: 'Pro Grinders', invite_code: 'PROG', owner_id: 'user-3', created_at: new Date().toISOString(), member_count: 10 },
    { id: 'club-3', name: 'Casual Friday', invite_code: 'CASU', owner_id: 'user-1', created_at: new Date().toISOString(), member_count: 5 },
    { id: 'club-4', name: 'Neon Knights', invite_code: 'NEON', owner_id: 'user-2', created_at: new Date().toISOString(), member_count: 12 },
    { id: 'club-5', name: 'Legacy Raiders', invite_code: 'LEGA', owner_id: 'user-3', created_at: new Date().toISOString(), member_count: 7 },
    { id: 'club-6', name: 'Pixel Pioneers', invite_code: 'PIXL', owner_id: 'user-1', created_at: new Date().toISOString(), member_count: 15 },
    { id: 'club-7', name: 'Final Bosses', invite_code: 'BOSS', owner_id: 'user-2', created_at: new Date().toISOString(), member_count: 20 },
];

export const MOCK_MEMBERS = [
    { id: 'mem-1', club_id: 'club-1', user_id: 'user-1', role: 'owner' },
    { id: 'mem-2', club_id: 'club-1', user_id: 'user-2', role: 'member' },
    { id: 'mem-3', club_id: 'club-1', user_id: 'user-3', role: 'admin' },
];

export const MOCK_JOIN_REQUESTS = [
    { id: 'req-1', club_id: 'club-1', user_id: 'user-4', status: 'pending', created_at: new Date().toISOString() },
    { id: 'req-2', club_id: 'club-0', user_id: 'user-2', status: 'pending', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'req-3', club_id: 'club-0', user_id: 'user-3', status: 'pending', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'req-4', club_id: 'club-0', user_id: 'user-4', status: 'pending', created_at: new Date(Date.now() - 10800000).toISOString() },
];

export const MOCK_SESSIONS = [
    {
        id: 'sess-1',
        club_id: 'club-1',
        game_id: 'game-1',
        week_number: 1,
        season_id: 1,
        start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),   // 4 days left
        is_active: true
    }
];

export const MOCK_SCORES = [
    { id: 'sc-1', session_id: 'sess-1', user_id: 'user-1', score_value: 15400, proof_image_url: '', submitted_at: new Date().toISOString() },
    { id: 'sc-2', session_id: 'sess-1', user_id: 'user-2', score_value: 12000, proof_image_url: '', submitted_at: new Date().toISOString() },
];
