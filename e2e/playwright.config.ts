import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent project for testing
dotenv.config({ path: path.join(__dirname, '../.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Set to false for Algorand wallet interactions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Run tests serially for wallet interactions
  reporter: [['html', { open: 'never' }]],
  
  use: {
    baseURL: process.env.SITE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    
    // Browser window size that works well with most UI elements
    viewport: { width: 1280, height: 720 },
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  
  // Set a generous timeout for Algorand transactions
  timeout: 60000,
  
  // Run local dev server for tests if needed
  webServer: {
    command: 'cd .. && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
