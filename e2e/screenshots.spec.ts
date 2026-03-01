import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Ensures the required environment variables are set
const { TEST_USER_EMAIL, TEST_USER_PASSWORD } = process.env;

// Helper to construct the screenshot path based on the current project/device
const getScreenshotPath = (testInfo: any, title: string) => {
    // e.g. 'tablet_7in', 'Chromebook'
    const deviceName = testInfo.project.name;
    const dir = path.join(process.cwd(), 'play-store-assets', 'raw-screenshots', deviceName);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return path.join(dir, `${title}.png`);
};

test.describe('Play Store Screenshots', () => {

    test.beforeAll(() => {
        if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
            console.error('⚠️  Missing TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables.');
            console.error('Run like: TEST_USER_EMAIL=test@email.com TEST_USER_PASSWORD=pass npx playwright test e2e/screenshots.spec.ts --config=playwright-screenshots.config.ts');
            process.exit(1);
        }
    });

    test('capture all required screens', async ({ page }, testInfo) => {
        // --- 1. LOGIN ---
        console.log(`[${testInfo.project.name}] Logging in as ${TEST_USER_EMAIL}...`);
        await page.goto('/');

        // Wait for the auth gate to settle.
        await page.waitForLoadState('networkidle');

        // Take a peek at what we're seeing
        console.log(`[${testInfo.project.name}] URL after load: ${page.url()}`);

        // Check if we need to log in
        const emailInput = page.locator('input[type="email"]');
        try {
            await emailInput.waitFor({ state: 'visible', timeout: 10000 });
            console.log(`[${testInfo.project.name}] Login form visible.`);

            await emailInput.fill(TEST_USER_EMAIL!);
            await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD!);

            // Wait for any button that looks like a login button
            const loginButton = page.locator('button:has-text("Initiate Login"), button:has-text("Login"), button[type="submit"]').first();
            await loginButton.click();

            // Wait for navigation back to home or club
            console.log(`[${testInfo.project.name}] Waiting for navigation...`);
            await page.waitForTimeout(2000); // Wait for click to register

            await page.waitForURL('**/(clubs|club|arcade|)', { timeout: 30000 });
            console.log(`[${testInfo.project.name}] Login successful. URL: ${page.url()}`);
        } catch (e: any) {
            console.warn(`[${testInfo.project.name}] Login process encountered an issue or already logged in. URL: ${page.url()}`);
            if (page.url().includes('login') || await emailInput.isVisible()) {
                await page.screenshot({ path: getScreenshotPath(testInfo, 'DEBUG_LoginFailed') });
            }
        }
        await page.waitForTimeout(3000); // Give data time to load

        // --- 2. HOMESCREEN (/clubs or /arcade depending on default) ---
        console.log(`[${testInfo.project.name}] Capturing Homescreen...`);
        await page.goto('/clubs');
        await page.waitForTimeout(3000); // wait for data/images
        await page.screenshot({ path: getScreenshotPath(testInfo, '01_Homescreen'), fullPage: true });

        // --- 3. CREATE A CLUB (/clubs/create) ---
        console.log(`[${testInfo.project.name}] Capturing Create a Club...`);
        await page.goto('/clubs/create');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: getScreenshotPath(testInfo, '02_CreateClub'), fullPage: true });

        // --- 4. CLUB OVERVIEW (/club) ---
        console.log(`[${testInfo.project.name}] Capturing Club Overview...`);
        await page.goto('/club');
        await page.waitForTimeout(4000); // Usually more data here
        await page.screenshot({ path: getScreenshotPath(testInfo, '03_ClubOverview'), fullPage: true });

        // --- 5. LEADERBOARDS ---
        console.log(`[${testInfo.project.name}] Capturing Leaderboards...`);
        try {
            await page.goto('/club');
            await page.waitForTimeout(2000);

            // Click the Leaderboard tab
            const leaderboardTab = page.getByRole('button', { name: /leaderboard/i });
            if (await leaderboardTab.isVisible()) {
                await leaderboardTab.click();
                await page.waitForTimeout(2000);

                // Wait for high score table
                await page.locator('table').first().waitFor({ state: 'visible', timeout: 5000 });
            } else {
                console.warn(`[${testInfo.project.name}] Leaderboard tab not found, trying /arcade fallback`);
                await page.goto('/arcade');
                await page.waitForTimeout(3000);
            }

            await page.evaluate(() => window.scrollTo(0, 0));
            await page.screenshot({ path: getScreenshotPath(testInfo, '04_Leaderboards'), fullPage: true });
        } catch (e: any) {
            console.warn(`[${testInfo.project.name}] Error capturing Leaderboards: ${e.message}`);
            await page.screenshot({ path: getScreenshotPath(testInfo, '04_Leaderboards_Error'), fullPage: true });
        }

        // --- 6. CHAT FEATURES ---
        console.log(`[${testInfo.project.name}] Capturing Chat Features...`);
        try {
            await page.goto('/club');
            await page.waitForTimeout(2000);
            // Assuming chat is a tab
            const chatTab = page.getByRole('button', { name: /chat/i });
            if (await chatTab.isVisible()) {
                await chatTab.click();
                await page.waitForTimeout(2000);
            }
            await page.screenshot({ path: getScreenshotPath(testInfo, '05_ChatFeatures'), fullPage: true });
        } catch (e: any) {
            console.warn(`[${testInfo.project.name}] Note: Could not find Chat. Took fallback screenshot.`);
            await page.screenshot({ path: getScreenshotPath(testInfo, '05_ChatFeatures_Fallback'), fullPage: true });
        }

        // --- 7. FRIEND LISTS (/friends) ---
        console.log(`[${testInfo.project.name}] Capturing Friend Lists...`);
        await page.goto('/friends');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: getScreenshotPath(testInfo, '06_FriendLists'), fullPage: true });

        console.log(`[${testInfo.project.name}] ✅ All screenshots captured successfully.`);
    });
});
