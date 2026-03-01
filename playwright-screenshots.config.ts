import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 120000,
    expect: {
        timeout: 15000,
    },
    fullyParallel: false,
    retries: 0,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'off',
        video: 'off',
        headless: true,
    },
    projects: [
        {
            name: 'tablet_7in',
            use: {
                viewport: { width: 1200, height: 1920 },
                deviceScaleFactor: 2,
            },
        },
        {
            name: 'tablet_10in',
            use: {
                viewport: { width: 1600, height: 2560 },
                deviceScaleFactor: 2,
            },
        },
        {
            name: 'chromebook',
            use: {
                viewport: { width: 1920, height: 1080 },
                deviceScaleFactor: 2,
                isMobile: false,
            },
        },
    ],
});
