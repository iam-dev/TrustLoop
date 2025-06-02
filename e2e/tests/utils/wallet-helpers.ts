import { Page, expect } from '@playwright/test';

/**
 * Helper functions for interacting with Algorand wallets in tests
 */

/**
 * Waits for and handles the Pera wallet connection popup
 * This simulates a user connecting their wallet
 */
export async function connectPeraWallet(page: Page): Promise<void> {
  // Click the connect wallet button
  await page.getByRole('button', { name: /connect wallet/i }).click();
  
  // Select Pera wallet option
  await page.getByRole('button', { name: /pera wallet/i }).click();
  
  // When testing on Testnet, we need to simulate the wallet approval
  // This can be done by using the Playwright context to handle the popup
  // or by mocking the wallet response
  
  // Wait for the connection to complete (look for user account display)
  await expect(page.getByText(/connected/i)).toBeVisible({ timeout: 15000 });
  
  console.log('Wallet connected successfully');
}

/**
 * Signs a transaction using the Pera wallet
 * This simulates a user approving a transaction
 */
export async function signTransaction(page: Page): Promise<void> {
  // Wait for transaction sign request to appear
  await expect(page.getByText(/confirm transaction/i, { exact: false })).toBeVisible({ timeout: 20000 });
  
  // Click the approve button
  await page.getByRole('button', { name: /approve|sign|confirm/i }).click();
  
  // Wait for transaction to be processed
  await expect(page.getByText(/transaction (submitted|processing|confirmed)/i)).toBeVisible({ timeout: 30000 });
  
  console.log('Transaction signed successfully');
}

/**
 * Waits for transaction confirmation
 */
export async function waitForTransactionConfirmation(page: Page): Promise<void> {
  // Wait for transaction confirmation message
  await expect(page.getByText(/transaction (confirmed|successful)/i)).toBeVisible({ timeout: 45000 });
  
  console.log('Transaction confirmed successfully');
}

/**
 * Get the user's connected wallet address
 */
export async function getWalletAddress(page: Page): Promise<string> {
  // This assumes the UI shows the truncated wallet address somewhere after connection
  const addressElement = page.getByText(/[A-Z2-7]{4}\.{3}[A-Z2-7]{4}/); // Algorand addresses are base32
  await expect(addressElement).toBeVisible();
  
  const addressText = await addressElement.textContent();
  return addressText || '';
}
