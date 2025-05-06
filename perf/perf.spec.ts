import { test, expect, chromium, devices, ConsoleMessage } from '@playwright/test';
import fs from 'fs';

const APP_URL = 'http://localhost:9002/';
const DEVICE = devices['Moto G4'];

// Utility to log errors
const logError = (msg: string) => {
  fs.appendFileSync('perf/console.log', msg + '\n');
};

test.describe('AudioSphere Performance & Error Test', () => {
  test('should load, play, and collect performance data on low-end device', async ({}) => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      ...DEVICE,
      locale: 'en-US',
      viewport: DEVICE.viewport,
      userAgent: DEVICE.userAgent,
      permissions: ['geolocation'],
    });
    const page = await context.newPage();

    // Capture console errors/warnings
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        logError(`[${msg.type()}] ${msg.text()}`);
      }
    });

    // Start tracing
    await context.tracing.start({ screenshots: true, snapshots: true });

    // Go to app
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click play (using aria-label)
    const playPauseBtn = page.getByRole('button', { name: /play|pause/i });
    await expect(playPauseBtn).toBeVisible();
    await playPauseBtn.click();
    await page.waitForTimeout(5000); // Let it play for a bit

    // Stop tracing and save
    await context.tracing.stop({ path: 'perf/trace.zip' });

    // Save performance metrics
    const metrics = await page.evaluate(() => JSON.stringify(window.performance.timing));
    fs.writeFileSync('perf/perf-metrics.json', metrics);

    await browser.close();

    // Output summary
    const errors = fs.existsSync('perf/console.log') ? fs.readFileSync('perf/console.log', 'utf-8') : 'No errors logged.';
    console.log('--- Performance Test Summary ---');
    console.log('Console Errors/Warnings:', errors);
    console.log('Performance trace saved to perf/trace.zip');
    console.log('Navigation timing saved to perf/perf-metrics.json');
  });
}); 