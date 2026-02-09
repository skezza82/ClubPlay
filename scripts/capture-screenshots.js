const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

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

(async () => {
    console.log('Starting screenshot generation...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Create output directory
    const outputDir = path.join(__dirname, '..', 'play-store-assets', 'screenshots');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const device of devices) {
        console.log(`Processing device: ${device.name}`);
        for (const pageInfo of pages) {
            console.log(`  - Capturing ${pageInfo.name}...`);
            await page.setViewportSize({ width: device.width, height: device.height });
            try {
                await page.goto(`http://localhost:3000${pageInfo.path}`, { waitUntil: 'networkidle' });
                // Wait for any animations
                await page.waitForTimeout(1000);

                await page.screenshot({
                    path: path.join(outputDir, `${device.name}_${pageInfo.name}.png`),
                    fullPage: false
                });
            } catch (e) {
                console.error(`Failed to capture ${pageInfo.name} for ${device.name}:`, e.message);
            }
        }
    }

    await browser.close();
    console.log('Done! Screenshots saved to play-store-assets/screenshots/');
})();
