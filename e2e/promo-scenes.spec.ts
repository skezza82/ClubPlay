import { test, expect } from '@playwright/test';

test.describe('Promo Video Scenes', () => {

    test('Scene 1: New User Journey', async ({ page }) => {
        // 1. Go to Home
        await page.goto('/');

        // 2. Register
        // Click "Register"
        await page.getByRole('button', { name: 'Register' }).click();

        // Fill form
        await page.getByPlaceholder('Gamer Tag').fill('StarPilot');
        await page.getByPlaceholder('Email Address').fill(`starpilot_${Date.now()}@clubplay.example`); // Unique email
        await page.getByPlaceholder('Password').fill('password123');

        // Submit
        await page.getByRole('button', { name: 'Complete Registration' }).click();

        // 3. Create Club
        // The dashboard might look different. Let's look for "Create Your Club" or "Create" link.
        // Based on error log: link "Create Your Club" [ref=e53] -> /clubs/create
        await expect(page.getByRole('link', { name: 'Create Your Club' })).toBeVisible({ timeout: 10000 });
        await page.getByRole('link', { name: 'Create Your Club' }).click();

        // Fill Club Details
        await page.getByPlaceholder('Club Name').fill('Starlight Drifters');
        await page.getByPlaceholder('e.g. STARFLEET').fill(`DRIFT${Date.now().toString().slice(-4)}`); // Unique code

        // Submit
        await page.getByRole('button', { name: 'Create Club' }).click();

        // 4. Verify Dashboard
        // After creation, we might be redirected. Look for the club name.
        await expect(page.getByText('Starlight Drifters')).toBeVisible({ timeout: 10000 });

        // Pause for effect
        await page.waitForTimeout(3000);
    });

    test('Scene 2: Challenge Creation', async ({ page }) => {
        // Login as StarPilot (re-registering for simplicity or assume prior test seeded state if sequential)
        // Actually, let's just use the seed user for stability or re-create user if independent.
        // Let's use the seeded 'Promo User' for Scenes 2 & 3 to be safe and consistent.

        await page.goto('/');

        // Login
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.getByPlaceholder('Email Address').fill('promo_hero@clubplay.example');
        await page.getByPlaceholder('Password').fill('password123');
        await page.getByRole('button', { name: 'Initiate Login' }).click();

        // Wait for Dashboard
        await expect(page.getByText('Welcome, ProGamer_X')).toBeVisible();

        // Go to Arcade
        // Error log shows link "Just looking to play? Visit The Arcade" to /arcade
        await page.goto('/arcade');
        await page.waitForTimeout(1000);

        // Click "Tetris" card
        // Failing here? Let's verify we are on arcade.
        await expect(page.getByRole('heading', { name: 'Arcade' })).toBeVisible();
        await page.getByText('Tetris').first().click();

        // Click Create Challenge
        // Warning: Start button might be "Create Challenge" or similar.
        await page.getByRole('button', { name: 'Create Challenge' }).click();

        // Launch
        await page.getByRole('button', { name: 'Launch Challenge' }).click();

        // Pause
        await page.waitForTimeout(3000);
    });

    test('Scene 3: Highscores', async ({ page }) => {
        // Login as Promo User
        await page.goto('/');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.getByPlaceholder('Email Address').fill('promo_hero@clubplay.example');
        await page.getByPlaceholder('Password').fill('password123');
        await page.getByRole('button', { name: 'Initiate Login' }).click();

        // Wait for Dashboard
        await expect(page.getByText('Welcome, ProGamer_X')).toBeVisible();

        // Click "Retro Legends" Club
        // In error log: link "Retro Legends Owner" [ref=e50]
        // We can click the heading or the link.
        await page.getByRole('link', { name: /Retro Legends/i }).first().click();

        // Scroll to Leaderboard
        // It might be "Active Challenge" or "Leaderboard". The log shows "Active Challenge" heading.
        // Let's look for "High Scores" or "Leaderboard" text if present, or just wait.
        // If no explicit leaderboard heading, just wait for score values.
        await expect(page.getByText('ProGamer_X')).toBeVisible();

        // Verify Highscores
        await expect(page.getByText('125,000')).toBeVisible(); // ProGamer_X
        // await expect(page.getByText('89,000')).toBeVisible(); // NeonRider -> Might need scrolling

        // Hover effect
        await page.getByText('125,000').hover();

        // Pause
        await page.waitForTimeout(5000);
    });

});
