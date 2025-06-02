import React, { useState, useEffect } from 'react';
import { Store, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import NFTCard from '../components/NFTCard';
import useAuthStore from '../store/useAuthStore';
import { getUserNFTs, listNFTForSale, purchaseNFT, type NFT } from '../lib/nftUtils';
import { supabase } from '../lib/supabase';

const Marketplace: React.FC = () => {
  const { address } = useAuthStore();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadNFTs();
    
    // Subscribe to marketplace changes
    const subscription = supabase
      .channel('marketplace_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'marketplace_listings' 
      }, () => {
        loadNFTs();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadNFTs = async () => {
    if (!address) return;
    setLoading(true);
    const userNFTs = await getUserNFTs(address);
    setNfts(userNFTs);
    setLoading(false);
  };

  const handleListNFT = async (nft: NFT) => {
    const price = window.prompt('Enter listing price in ALGO:');
    if (!price || !address) return;

    const success = await listNFTForSale(
      nft.id,
      parseFloat(price),
      address
    );

    if (success) {
      loadNFTs();
    }
  };

  const handlePurchaseNFT = async (nft: NFT) => {
    if (!address || !nft.listed_price) return;

    const confirmed = window.confirm(
      `Purchase this NFT for ${nft.listed_price} ALGO?`
    );

    if (!confirmed) return;

    const success = await purchaseNFT(
      nft.id,
      address,
      nft.listed_price
    );

    if (success) {
      loadNFTs();
    }
  };

  const filteredNFTs = nfts.filter(nft => 
    nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nft.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
        <div className="flex items-center mb-4 sm:mb-0">
          <Store className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold">NFT Marketplace</h1>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400" 
              size={18} 
            />
            <input
              type="text"
              placeholder="Search NFTs..."
              className="input pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline"
            leftIcon={<Filter size={16} />}
          >
            Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-surface-500">Loading NFTs...</p>
        </div>
      ) : filteredNFTs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNFTs.map((nft) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              isOwner={nft.owner_address === address}
              onList={() => handleListNFT(nft)}
              onPurchase={() => handlePurchaseNFT(nft)}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-surface-500 mb-4">No NFTs found</p>
            <Button variant="outline" onClick={loadNFTs}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Marketplace;