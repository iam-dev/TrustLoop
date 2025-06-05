import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';
import { CONTRACT_IDS } from './contracts';

// Create a connection to the Algorand node
const algodClient = new algosdk.Algodv2(
  import.meta.env.VITE_ALGORAND_API_TOKEN || '',
  import.meta.env.VITE_ALGORAND_NODE_URL || 'https://testnet-api.algonode.cloud',
  import.meta.env.VITE_ALGORAND_NODE_PORT || ''
);

// Define a shorter timeout for transaction operations
const TX_TIMEOUT = 60; // seconds

// Shared Pera wallet instance
export const peraWallet = new PeraWalletConnect();

// Types for transaction status updates
export type TransactionStatus = 'pending' | 'confirming' | 'confirmed' | 'failed';

// Define transaction update interface
export interface TransactionUpdate {
  status: TransactionStatus;
  message: string;
  txId?: string;
  confirmations?: number;
  error?: Error;
}

/**
 * Helper function for handling transaction errors
 * @param error - The error that occurred
 * @param operation - Description of the operation that failed
 * @returns Never returns, always throws the error
 */
export function handleTransactionError(error: any, operation: string): never {
  console.error(`Error in ${operation}:`, error);
  throw error;
}

/**
 * Signs a transaction using Pera Wallet
 */
export async function signTransaction(txn: algosdk.Transaction, address: string): Promise<Uint8Array> {
  const txnToSign = [{
    txn: txn,
    signers: [address],
  }];

  try {
    const signedTxns = await peraWallet.signTransaction([txnToSign]);
    return signedTxns[0];
  } catch (error) {
    console.error("Failed to sign transaction:", error);
    throw error;
  }
}

/**
 * Submits a signed transaction to the network and monitors its status
 */
export async function submitAndMonitorTransaction(
  signedTxn: Uint8Array,
  callback: (update: TransactionUpdate) => void
): Promise<void> {
  try {
    // Update status to pending
    callback({
      status: 'pending',
      message: 'Submitting transaction to the network...'
    });

    // Submit the transaction
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    // Handle different response formats based on SDK version
    let txId = '';
    if (typeof response === 'string') {
      txId = response;
    } else if (typeof response === 'object') {
      txId = response.txid || (response as any).txId || '';
    }
    console.log('Transaction submitted:', txId);

    // Update status to confirming
    callback({
      status: 'confirming',
      message: 'Transaction submitted, waiting for confirmation...',
      txId
    });

    // Wait for confirmation
    const confirmedTxn = await waitForConfirmation(txId, 5, callback);

    // Final status update
    callback({
      status: 'confirmed',
      message: 'Transaction confirmed successfully!',
      txId,
      confirmations: confirmedTxn.confirmations
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    callback({
      status: 'failed',
      message: 'Transaction failed: ' + (error instanceof Error ? error.message : String(error)),
      error: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Wait for transaction confirmation
 * @param txId Transaction ID to wait for
 * @param maxRetries Maximum number of retries (legacy parameter, using timeout instead)
 * @param callback Optional callback for status updates
 * @returns Promise resolving to an object with confirmation info
 */
export async function waitForConfirmation(
  txId: string,
  maxRetries = 20,
  callback?: (update: TransactionUpdate) => void
): Promise<{ confirmations: number }> {
  try {
    // Get the current round for reference
    const status = await algodClient.status().do();
    // Handle different property names in different SDK versions with type assertion
    const currentRound = (status as any)['last-round'] || status.lastRound || 0;
    
    // Set up promise to be resolved when transaction confirms or fails
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = TX_TIMEOUT / 3; // Check interval is 3 seconds
      
      if (callback) {
        callback({
          status: 'confirming',
          message: 'Waiting for transaction confirmation',
          txId
        });
      }
      
      const txConfirmationCheck = setInterval(async () => {
        try {
          attempts++;
          
          // Get pending transaction info
          const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
          
          // Check different property names based on SDK version
          const confirmedRoundValue = 
            (pendingInfo as any)['confirmed-round'] || 
            pendingInfo.confirmedRound || 
            (pendingInfo as any).confirmed_round;
          
          if (confirmedRoundValue && Number(confirmedRoundValue) > 0) {
            // Transaction confirmed
            clearInterval(txConfirmationCheck);
            const confirmations = Number(confirmedRoundValue) - currentRound;
            
            if (callback) {
              callback({
                status: 'confirmed',
                message: `Transaction confirmed in round ${confirmedRoundValue}`,
                txId,
                confirmations
              });
            }
            
            resolve({ confirmations: Number(confirmedRoundValue) - currentRound });
          } else if (attempts >= maxAttempts) {
            // Transaction timed out
            clearInterval(txConfirmationCheck);
            const timeoutError = new Error('Transaction confirmation timed out');
            
            if (callback) {
              callback({
                status: 'failed',
                message: 'Transaction confirmation timed out',
                txId,
                error: timeoutError
              });
            }
            
            reject(timeoutError);
          } else if (attempts % 2 === 0 && callback) {
            // Periodic update on even attempts
            callback({
              status: 'confirming',
              message: `Waiting for confirmation (attempt ${attempts}/${maxAttempts})`,
              txId
            });
          }
        } catch (error) {
          console.error('Error checking transaction status:', error);
          
          // If we've reached max attempts, stop checking and report failure
          if (attempts >= maxAttempts) {
            clearInterval(txConfirmationCheck);
            
            if (callback) {
              callback({
                status: 'failed',
                message: 'Transaction confirmation failed',
                txId,
                error: error instanceof Error ? error : new Error('Unknown error checking transaction')
              });
            }
            
            reject(error);
          }
        }
      }, 3000);
    });
  } catch (error) {
    console.error('Error in waitForConfirmation:', error);
    
    if (callback) {
      callback({
        status: 'failed',
        message: 'Transaction confirmation failed',
        txId,
        error: error instanceof Error ? error : new Error('Error in waitForConfirmation')
      });
    }
    
    throw error;
  }
}

/**
 * Creates a task verification transaction
 */
export async function createTaskVerificationTxn(
  userAddress: string,
  taskId: string
): Promise<algosdk.Transaction> {
  // Get transaction parameters
  const params = await algodClient.getTransactionParams().do();
  
  // Create application call to verify task completion
  const appArgs = [
    new Uint8Array(Buffer.from('verify_task')),
    new Uint8Array(Buffer.from(taskId))
  ];
  
  // Use the generic transaction creation method
  return algosdk.makeApplicationNoOpTxnFromObject({
    sender: userAddress,
    suggestedParams: params,
    appIndex: Number(CONTRACT_IDS.PROOF_APP_ID),
    appArgs: appArgs
  });
}

/**
 * Creates an NFT minting transaction
 */
export async function createNFTMintingTxn(
  userAddress: string,
  taskId: string,
  metadata: { name: string; description: string; imageUrl: string; }
): Promise<algosdk.Transaction> {
  // Get transaction parameters
  const params = await algodClient.getTransactionParams().do();
  
  // Convert metadata to app args
  const appArgs = [
    new Uint8Array(Buffer.from('mint_nft')),
    new Uint8Array(Buffer.from(taskId)),
    new Uint8Array(Buffer.from(JSON.stringify(metadata).slice(0, 128))) // Truncate metadata if too long
  ];
  
  // Use the generic transaction creation method
  return algosdk.makeApplicationNoOpTxnFromObject({
    sender: userAddress,
    suggestedParams: params,
    appIndex: Number(CONTRACT_IDS.NFT_APP_ID),
    appArgs: appArgs
  });
}

/**
 * Creates a marketplace listing transaction
 */
export async function createListNFTTxn(
  userAddress: string,
  assetId: number,
  price: number
): Promise<algosdk.Transaction> {
  // Get transaction parameters
  const params = await algodClient.getTransactionParams().do();
  
  // Create application call to list NFT
  const appArgs = [
    new Uint8Array(Buffer.from('list_nft')),
    algosdk.encodeUint64(assetId),
    algosdk.encodeUint64(Math.floor(price * 1_000_000)) // Convert to microalgos
  ];
  
  // Use the generic transaction creation method
  return algosdk.makeApplicationNoOpTxnFromObject({
    sender: userAddress,
    suggestedParams: params,
    appIndex: Number(CONTRACT_IDS.MARKETPLACE_APP_ID),
    appArgs: appArgs,
    foreignAssets: [assetId]
  });
}

/**
 * Creates marketplace purchase transactions
 * Returns an array with both the app call and payment transaction
 */
export async function createPurchaseNFTTxn(
  userAddress: string,
  assetId: number,
  price: number,
  sellerAddress: string
): Promise<algosdk.Transaction[]> {
  // Get transaction parameters
  const params = await algodClient.getTransactionParams().do();
  
  // Application call for buying NFT
  const appArgs = [
    new Uint8Array(Buffer.from('buy_nft')),
    algosdk.encodeUint64(assetId)
  ];
  
  // Create app transaction with SDK method
  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    sender: userAddress,
    suggestedParams: params,
    appIndex: Number(CONTRACT_IDS.MARKETPLACE_APP_ID),
    appArgs: appArgs,
    foreignAssets: [assetId]
  });
  
  // Create payment transaction with SDK method
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: userAddress,
    receiver: sellerAddress,
    amount: Math.floor(price * 1_000_000), // Convert to microalgos
    suggestedParams: params
  });
  
  // Return both transactions to be grouped and signed together
  return [appCallTxn, paymentTxn];
}