import algosdk from 'algosdk';
import { supabase } from './supabase';

const algodClient = new algosdk.Algodv2(
  '', 
  'https://testnet-api.algonode.cloud',
  ''
);

export interface NFT {
  id: number;
  name: string;
  description: string;
  image_url: string;
  metadata: Record<string, any>;
  owner_address: string;
  created_at: string;
  listed_price?: number;
}

export async function mintWelcomeNFT(address: string): Promise<{ success: boolean; assetId?: number }> {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // ARC3 metadata
    const metadata = {
      name: "TrustLoop Explorer Badge",
      description: "Verified Explorer of the TrustLoop ecosystem",
      image: "https://your-ipfs-gateway/welcome-badge.png",
      properties: {
        rarity: "Common",
        type: "Badge",
      }
    };

    // In a real implementation, this would create an ASA with the metadata
    const assetId = Math.floor(Math.random() * 1000000);

    // Cache NFT data in Supabase
    await supabase.from('nfts').insert({
      asset_id: assetId,
      owner_address: address,
      metadata,
      created_at: new Date().toISOString(),
    });

    return { success: true, assetId };
  } catch (error) {
    console.error('Error minting welcome NFT:', error);
    return { success: false };
  }
}

export async function getUserNFTs(address: string): Promise<NFT[]> {
  try {
    const { data: nfts, error } = await supabase
      .from('nfts')
      .select('*')
      .eq('owner_address', address);

    if (error) throw error;
    return nfts || [];
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    return [];
  }
}

export async function listNFTForSale(
  nftId: number,
  price: number,
  sellerAddress: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('marketplace_listings')
      .insert({
        nft_id: nftId,
        price,
        seller_address: sellerAddress,
        status: 'active'
      });

    return !error;
  } catch (error) {
    console.error('Error listing NFT:', error);
    return false;
  }
}

export async function purchaseNFT(
  nftId: number,
  buyerAddress: string,
  price: number
): Promise<boolean> {
  try {
    // In a real implementation, this would handle the Algorand transaction
    // and smart contract interaction
    
    const { error } = await supabase
      .from('marketplace_listings')
      .update({ 
        status: 'sold',
        buyer_address: buyerAddress,
        sold_at: new Date().toISOString()
      })
      .eq('nft_id', nftId);

    if (error) throw error;

    // Update NFT ownership
    await supabase
      .from('nfts')
      .update({ owner_address: buyerAddress })
      .eq('id', nftId);

    return true;
  } catch (error) {
    console.error('Error purchasing NFT:', error);
    return false;
  }
}