import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import { formatDate } from '../lib/utils';
import { listNFTForSale } from '../lib/nftUtils';
import type { NFT } from '../lib/nftUtils';
import { Tag, DollarSign, Calendar, Star } from 'lucide-react';

interface NFTCardProps {
  nft: NFT;
  onList?: (nftId: number, price: number) => void;
  onPurchase?: (nftId: number, price: number) => void;
  isOwner?: boolean;
  displayMode?: 'grid' | 'list';
  showActions?: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({ 
  nft, 
  onList, 
  onPurchase, 
  isOwner = false,
  displayMode = 'grid',
  showActions = false
}) => {
  const [listingPrice, setListingPrice] = useState<string>('');
  const [isListing, setIsListing] = useState(false);
  const [showListingInput, setShowListingInput] = useState(false);

  const handleList = async () => {
    if (!listingPrice || isNaN(Number(listingPrice)) || Number(listingPrice) <= 0) return;
    
    setIsListing(true);
    try {
      const price = Number(listingPrice);
      if (onList) {
        onList(nft.id, price);
      } else {
        // Fallback to direct API call if no handler provided
        await listNFTForSale(nft.id, price, nft.owner_address);
        // Force a refresh in a real app
      }
    } finally {
      setIsListing(false);
      setShowListingInput(false);
    }
  };

  const handlePurchase = () => {
    if (!nft.listed_price || !onPurchase) return;
    onPurchase(nft.id, nft.listed_price);
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'text-surface-500';
      case 'uncommon': return 'text-success-500';
      case 'rare': return 'text-primary-500';
      case 'epic': return 'text-warning-500';
      case 'legendary': return 'text-accent-500';
      default: return 'text-surface-500';
    }
  };
  if (displayMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="flex items-center p-4">
          <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md mr-4">
            <img 
              src={nft.image_url} 
              alt={nft.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-grow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-base">{nft.name}</h3>
                <p className="text-xs text-surface-600 line-clamp-1">{nft.description}</p>
              </div>
              {nft.listed_price && (
                <span className="font-medium text-primary-700 text-sm">
                  {nft.listed_price} ALGO
                </span>
              )}
            </div>
            
            <div className="flex items-center mt-2 text-xs space-x-3">
              <span className="flex items-center text-surface-500">
                <Calendar size={12} className="mr-1" />
                {formatDate(nft.created_at)}
              </span>
              <span className="flex items-center text-surface-500">
                <Tag size={12} className="mr-1" />
                {nft.metadata?.properties?.type || 'NFT'}
              </span>
              {nft.metadata?.properties?.rarity && (
                <span className={`flex items-center ${getRarityColor(nft.metadata?.properties?.rarity)}`}>
                  <Star size={12} className="mr-1" />
                  {nft.metadata.properties.rarity}
                </span>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="ml-4 flex-shrink-0">
              {isOwner && !nft.listed_price && !showListingInput ? (
                <Button 
                  onClick={() => setShowListingInput(true)}
                  size="sm"
                  variant="outline"
                >
                  List for Sale
                </Button>
              ) : isOwner && !nft.listed_price && showListingInput ? (
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" 
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="Price in ALGO"
                    className="w-24 px-2 py-1 text-sm border rounded"
                  />
                  <Button 
                    onClick={handleList}
                    size="sm"
                    isLoading={isListing}
                  >
                    Confirm
                  </Button>
                </div>
              ) : !isOwner && nft.listed_price ? (
                <Button 
                  onClick={handlePurchase}
                  size="sm"
                >
                  Purchase
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Grid display mode (default)
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square overflow-hidden">
        <img 
          src={nft.image_url} 
          alt={nft.name}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{nft.name}</h3>
          {nft.metadata?.properties?.rarity && (
            <span className={`text-xs px-2 py-0.5 rounded-full bg-surface-100 ${getRarityColor(nft.metadata?.properties?.rarity)}`}>
              {nft.metadata.properties.rarity}
            </span>
          )}
        </div>
        
        <p className="text-sm text-surface-600 mb-3 line-clamp-2">{nft.description}</p>
        
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center text-surface-500">
            <Calendar size={12} className="mr-1" />
            {formatDate(nft.created_at)}
          </span>
          {nft.listed_price && (
            <span className="font-medium text-primary-700 flex items-center">
              <DollarSign size={12} className="mr-1" />
              {nft.listed_price} ALGO
            </span>
          )}
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 bg-surface-50">
          {showListingInput ? (
            <div className="w-full flex items-center space-x-2">
              <input 
                type="number" 
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder="Price in ALGO"
                className="flex-1 px-3 py-2 text-sm border rounded"
              />
              <Button 
                onClick={handleList}
                isLoading={isListing}
                size="sm"
              >
                List
              </Button>
            </div>
          ) : isOwner ? (
            !nft.listed_price && (
              <Button 
                onClick={() => setShowListingInput(true)}
                className="w-full"
                variant="outline"
                leftIcon={<DollarSign size={14} />}
              >
                List for Sale
              </Button>
            )
          ) : (
            nft.listed_price && (
              <Button 
                onClick={handlePurchase}
                className="w-full"
              >
                Purchase
              </Button>
            )
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default NFTCard;