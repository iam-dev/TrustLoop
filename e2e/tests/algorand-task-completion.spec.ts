import { test, expect } from '@playwright/test';
import { connectPeraWallet, signTransaction, waitForTransactionConfirmation } from './utils/wallet-helpers';

test.describe('Algorand Task Verification Flow', () => {
  // Use a single browser context for all tests in this file to maintain wallet connection
  test.beforeAll(async ({ browser }) => {
    // Create a single browser context that will be shared
    const context = await browser.newContext();
    // Store it in the test object for later use
    test.info().attachments.push({
      name: 'context',
      body: JSON.stringify({ id: context.id() }),
      contentType: 'application/json'
    });
  });

  test('User can complete a task and verify it on Algorand testnet', async ({ page }) => {
    // Navigate to the TrustLoop homepage
    await page.goto('/');
    
    // Step 1: Connect wallet
    await test.step('Connect Algorand wallet', async () => {
      await connectPeraWallet(page);
      
      // Verify wallet is connected by checking for wallet address display
      await expect(page.getByText(/[A-Z2-7]{4}\.{3}[A-Z2-7]{4}/)).toBeVisible();
    });
    
    // Step 2: Navigate to tasks page
    await test.step('Navigate to tasks page', async () => {
      await page.getByRole('link', { name: /tasks/i }).click();
      await expect(page.getByRole('heading', { name: /available tasks/i })).toBeVisible();
    });
    
    // Step 3: Select a task to complete
    await test.step('Select a task to complete', async () => {
      // Find the first available task and click on it
      const taskCard = page.locator('.task-card').first();
      await taskCard.click();
      
      // Verify task details are displayed
      await expect(page.getByText(/task details/i)).toBeVisible();
    });
    
    // Step 4: Complete the task
    await test.step('Complete the task', async () => {
      // Click on the "Complete Task" button
      await page.getByRole('button', { name: /complete task/i }).click();
      
      // Simulate task completion - this would depend on the specific task
      // For example, if it's a form submission:
      await page.getByLabel(/completion evidence/i).fill('Completed the task as requested');
      await page.getByRole('button', { name: /submit/i }).click();
    });
    
    // Step 5: Verify task on blockchain
    await test.step('Verify task on Algorand blockchain', async () => {
      // Click on verify task button
      await page.getByRole('button', { name: /verify on blockchain/i }).click();
      
      // This will trigger a transaction - handle wallet signing
      await signTransaction(page);
      
      // Wait for the transaction to be confirmed
      await waitForTransactionConfirmation(page);
      
      // Check for success message
      await expect(page.getByText(/task verified successfully/i)).toBeVisible();
    });
    
    // Step 6: Check NFT minting (optional)
    await test.step('Check NFT reward (if applicable)', async () => {
      // Navigate to NFT gallery
      await page.getByRole('link', { name: /nfts/i }).click();
      
      // Verify the NFT appears in the gallery
      await expect(page.locator('.nft-card').first()).toBeVisible();
    });
    
    // Step 7: Verify transaction details
    await test.step('Verify transaction details', async () => {
      // Check if transaction explorer link is available
      const txExplorerLink = page.getByRole('link', { name: /view on explorer/i });
      if (await txExplorerLink.isVisible()) {
        // Get the href attribute to verify it points to Algorand explorer
        const href = await txExplorerLink.getAttribute('href');
        expect(href).toContain('explorer.algorand');
      }
    });
  });
});
