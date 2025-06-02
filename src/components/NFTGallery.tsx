import React, { useState, useEffect } from 'react';
import { ImageIcon, RefreshCw, Filter, Grid, List } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import NFTCard from './NFTCard';
import { getUserNFTs } from '../lib/nftUtils';
import type { NFT } from '../lib/nftUtils';

interface NFTGalleryProps {
  walletAddress?: string;
}

const NFTGallery: React.FC<NFTGalleryProps> = ({ walletAddress }) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    if (walletAddress) {
      loadNFTs();
    }
  }, [walletAddress]);

  const loadNFTs = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    try {
      const userNfts = await getUserNFTs(walletAddress);
      setNfts(userNfts);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(filter === newFilter ? null : newFilter);
  };

  const filteredNFTs = filter
    ? nfts.filter(nft => {
        if (filter === 'Badge') {
          return nft.metadata?.properties?.type === 'Badge';
        }
        if (filter === 'Art') {
          return nft.metadata?.properties?.type === 'Art';
        }
        if (filter === 'Reward') {
          return nft.metadata?.properties?.type === 'Reward';
        }
        return true;
      })
    : nfts;

  if (!walletAddress) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 text-center">
          <ImageIcon size={48} className="mx-auto mb-4 text-surface-300" />
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-surface-600">
            Connect your Algorand wallet to view your NFT collection
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">My NFT Collection</h2>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-md overflow-hidden border border-surface-200">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className={filter === 'Badge' ? 'bg-primary-100 text-primary-700' : ''}
            onClick={() => handleFilterChange('Badge')}
          >
            Badges
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={filter === 'Art' ? 'bg-primary-100 text-primary-700' : ''}
            onClick={() => handleFilterChange('Art')}
          >
            Art
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={filter === 'Reward' ? 'bg-primary-100 text-primary-700' : ''}
            onClick={() => handleFilterChange('Reward')}
          >
            Rewards
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadNFTs}
            isLoading={isLoading}
            leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw size={32} className="animate-spin text-primary-600" />
        </div>
      ) : filteredNFTs.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="p-6 text-center">
            <ImageIcon size={48} className="mx-auto mb-4 text-surface-300" />
            <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
            <p className="text-surface-600">
              {filter ? 'No NFTs match the selected filter' : 'Complete tasks to earn your first NFT'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
          : "space-y-4"
        }>
          {filteredNFTs.map(nft => (
            <NFTCard 
              key={nft.id} 
              nft={nft} 
              displayMode={viewMode}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTGallery;
