import { test, expect } from '@playwright/test';

const devices = [
    { name: 'phone', width: 1080, height: 1920 },
    { name: 'tablet7', width: 1200, height: 1920 }, // 7-inch / 8-inch range roughly
    { name: 'tablet10', width: 1600, height: 2560 }, // 10-inch
    { name: 'chromebook', width: 1366, height: 768 },
];

const pages = [
    { name: 'home', path: '/' },
    { name: 'arcade', path: '/arcade' },
    { name: 'login', path: '/login' },
    { name: 'find-club', path: '/club/find' },
];

test.describe('Generate Play Store Screenshots', () => {
    for (const device of devices) {
        for (const pageInfo of pages) {
            test(`${device.name} - ${pageInfo.name}`, async ({ page }) => {
                await page.setViewportSize({ width: device.width, height: device.height });
                await page.goto(`http://localhost:3000${pageInfo.path}`, { waitUntil: 'networkidle' });

                // Wait a bit for animations or images
                await page.waitForTimeout(1000);

                // Ensure directory exists (Playwright does this automatically usually)
                await page.screenshot({
                    path: `play-store-assets/${device.name}_${pageInfo.name}.png`,
                    fullPage: false
                });
            });
        }
    }
});
