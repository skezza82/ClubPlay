require('dotenv').config({ path: '.env.local' });
const { buildAuthorization, getUserRecentAchievements } = require('@retroachievements/api');

async function test() {
    const raUsername = process.env.RA_USERNAME;
    const raApiKey = process.env.RA_API_KEY;
    const testUsername = 'Skezza30';

    console.log('Using RA_USERNAME:', raUsername);
    console.log('Using RA_API_KEY:', raApiKey ? '***' + raApiKey.slice(-4) : 'MISSING');

    if (!raUsername || !raApiKey) {
        console.error('Missing credentials');
        return;
    }

    try {
        const authorization = buildAuthorization({
            username: raUsername,
            webApiKey: raApiKey
        });

        console.log('Fetching recent achievements for:', testUsername);
        const recentAchievements = await getUserRecentAchievements(
            authorization,
            { username: testUsername, recentMinutes: 10080 }
        );

        console.log('Success!');
        console.log('Count:', recentAchievements.length);
        if (recentAchievements.length > 0) {
            console.log('First achievement:', JSON.stringify(recentAchievements[0], null, 2));
        }
    } catch (error) {
        console.error('API Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

test();
