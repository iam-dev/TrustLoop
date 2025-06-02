// Contract IDs for Algorand smart contracts
export const CONTRACT_IDS = {
    PROOF_APP_ID: import.meta.env.VITE_PROOF_APP_ID,
    NFT_APP_ID: import.meta.env.VITE_NFT_APP_ID,
    MARKETPLACE_APP_ID: import.meta.env.VITE_MARKETPLACE_APP_ID,
  };
  
  // Network configuration
  export const NETWORK = import.meta.env.VITE_ALGORAND_NETWORK || 'TestNet';