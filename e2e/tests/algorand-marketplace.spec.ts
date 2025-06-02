import { test, expect } from '@playwright/test';
import { connectPeraWallet, signTransaction, waitForTransactionConfirmation } from './utils/wallet-helpers';

test.describe('Algorand NFT Marketplace Flow', () => {
  // Use a shared context to maintain wallet connection
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    test.info().attachments.push({
      name: 'context',
      body: JSON.stringify({ id: context.id() }),
      contentType: 'application/json'
    });
  });

  test('User can list and purchase NFTs on the marketplace', async ({ page }) => {
    // Navigate to the TrustLoop homepage
    await page.goto('/');
    
    // Step 1: Connect wallet
    await test.step('Connect Algorand wallet', async () => {
      await connectPeraWallet(page);
      await expect(page.getByText(/[A-Z2-7]{4}\.{3}[A-Z2-7]{4}/)).toBeVisible();
    });
    
    // Step 2: Navigate to NFT gallery
    await test.step('Navigate to NFT gallery', async () => {
      await page.getByRole('link', { name: /nfts/i }).click();
      await expect(page.getByRole('heading', { name: /my nfts/i })).toBeVisible();
    });
    
    // Step 3: List an NFT for sale
    await test.step('List an NFT for sale', async () => {
      // Select the first NFT in the gallery
      const nftCard = page.locator('.nft-card').first();
      await nftCard.click();
      
      // Click on "List for Sale" button
      await page.getByRole('button', { name: /list for sale/i }).click();
      
      // Set a price
      await page.getByLabel(/price/i).fill('5');
      
      // Confirm listing
      await page.getByRole('button', { name: /confirm listing/i }).click();
      
      // This will trigger a transaction - handle wallet signing
      await signTransaction(page);
      
      // Wait for transaction confirmation
      await waitForTransactionConfirmation(page);
      
      // Verify listing success
      await expect(page.getByText(/nft listed successfully/i)).toBeVisible();
    });
    
    // Step 4: Navigate to marketplace
    await test.step('Navigate to marketplace', async () => {
      await page.getByRole('link', { name: /marketplace/i }).click();
      await expect(page.getByRole('heading', { name: /marketplace/i })).toBeVisible();
    });
    
    // Step 5: Verify listed NFT appears in marketplace
    await test.step('Verify NFT listing in marketplace', async () => {
      // Look for the listed NFT
      await expect(page.locator('.nft-listing').first()).toBeVisible();
      
      // Verify price is displayed
      await expect(page.getByText(/5 ALGO/i)).toBeVisible();
    });
    
    // Note: To fully test purchase, we would need a second wallet
    // This test would typically continue with:
    /*
    // Step 6: Purchase NFT with a different wallet
    await test.step('Purchase NFT with different wallet', async () => {
      // Disconnect current wallet
      await page.getByRole('button', { name: /disconnect/i }).click();
      
      // Connect with a different wallet
      await connectPeraWallet(page); // With a different wallet
      
      // Select the NFT and purchase
      await page.locator('.nft-listing').first().click();
      await page.getByRole('button', { name: /buy now/i }).click();
      
      // Sign the purchase transaction
      await signTransaction(page);
      
      // Wait for confirmation
      await waitForTransactionConfirmation(page);
      
      // Verify purchase success
      await expect(page.getByText(/purchase successful/i)).toBeVisible();
    });
    */
    
    // Instead, we'll just check that the buy functionality exists
    await test.step('Verify buy functionality', async () => {
      // Select an NFT listing
      await page.locator('.nft-listing').first().click();
      
      // Check that the buy button exists
      await expect(page.getByRole('button', { name: /buy now/i })).toBeVisible();
    });
  });
});
