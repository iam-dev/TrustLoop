# TrustLoop Environment Variables Update

## Deployed Contract IDs

The following Algorand smart contracts have been successfully deployed to TestNet:

1. **Proof-of-Action App ID**: 740510673
2. **NFT Minting App ID**: 740510823
3. **Marketplace App ID**: 740510687

## Update Your Frontend Environment File

Please add the following variables to your frontend `.env` file:

```
# Algorand Contract IDs
VITE_PROOF_APP_ID=740510673
VITE_NFT_APP_ID=740510823
VITE_MARKETPLACE_APP_ID=740510687
```

These should be added alongside your existing variables:

```
VITE_SUPABASE_URL=https://yarzdsfeeahgkphnttjz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ALGORAND_NETWORK=TestNet
```

## Contract Configuration JSON

The contract configuration has been saved to `contracts/contract_config.json` for reference.

## Integrating With UI Code

When integrating with the UI code, ensure you:

1. Import the contract IDs from environment variables in your component files:
   ```javascript
   const proofAppId = import.meta.env.VITE_PROOF_APP_ID;
   const nftAppId = import.meta.env.VITE_NFT_APP_ID;
   const marketplaceAppId = import.meta.env.VITE_MARKETPLACE_APP_ID;
   ```

2. Use these IDs when making calls to the Algorand blockchain through the SDK.

3. Reference the deployed app IDs when:
   - Verifying task completion with the Proof-of-Action contract
   - Minting NFTs as rewards with the NFT contract
   - Listing, buying, or selling NFTs with the Marketplace contract
