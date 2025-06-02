import algosdk from 'algosdk';
import { CONTRACT_IDS } from './contracts';

// Create a connection to the Algorand node
// For demonstration purposes, we're using the TestNet
const algodClient = new algosdk.Algodv2(
  '', 
  'https://testnet-api.algonode.cloud', 
  ''
);

/**
 * Gets the account information for a given address
 */
export async function getAccountInfo(address: string) {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return accountInfo;
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
}

/**
 * Gets the suggested transaction parameters
 */
export async function getSuggestedParams() {
  try {
    return await algodClient.getTransactionParams().do();
  } catch (error) {
    console.error('Error getting suggested params:', error);
    throw error;
  }
}

/**
 * Verifies user task completion using the Proof-of-Action smart contract
 */
export async function verifyTaskCompletion(
  userAddress: string,
  taskId: string
) {
  try {
    console.log(`Verifying task ${taskId} completion for user ${userAddress}`);
    console.log(`Using Proof-of-Action contract: ${CONTRACT_IDS.PROOF_APP_ID}`);
    
    // Get transaction parameters (will be used in actual implementation)
    await getSuggestedParams();
    
    // In a real implementation with working types, we would:
    // 1. Create application call transaction
    // 2. Sign it with the user's wallet
    // 3. Submit to the network
    
    // For now, we return the necessary parameters for the frontend to handle
    return {
      success: true,
      contractId: CONTRACT_IDS.PROOF_APP_ID,
      action: 'verify_task',
      parameters: {
        taskId,
        userAddress
      },
      message: 'Task verification parameters prepared',
    };
  } catch (error) {
    console.error('Error preparing task verification:', error);
    return {
      success: false,
      message: 'Error processing task verification',
    };
  }
}

/**
 * Mints an NFT reward for a user using the NFT Minting smart contract
 */
export async function mintNFTReward(
  userAddress: string,
  taskId: string,
  metadata: Record<string, any>
) {
  try {
    console.log(`Minting NFT for user ${userAddress} for task ${taskId}`);
    console.log(`Using NFT Minting contract: ${CONTRACT_IDS.NFT_APP_ID}`);
    
    // In a real implementation with working types, we would:
    // 1. Create application call to the NFT minting contract
    // 2. Include metadata like name, description, image URL in the app args
    // 3. Sign it with the user's wallet
    // 4. Submit to the network
    
    // For now, return the necessary parameters for the frontend to handle
    return {
      success: true,
      contractId: CONTRACT_IDS.NFT_APP_ID,
      action: 'mint_nft',
      parameters: {
        taskId,
        userAddress,
        metadata: JSON.stringify(metadata)
      },
      message: 'NFT minting parameters prepared',
    };
  } catch (error) {
    console.error('Error preparing NFT minting:', error);
    return {
      success: false,
      message: 'Error preparing NFT minting',
    };
  }
}