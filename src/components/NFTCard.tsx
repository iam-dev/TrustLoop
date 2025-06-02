import React from 'react';
import { Card, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import { formatAddress } from '../lib/utils';
import type { NFT } from '../lib/nftUtils';

interface NFTCardProps {
  nft: NFT;
  onList?: () => void;
  onPurchase?: () => void;
  isOwner: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, onList, onPurchase, isOwner }) => {
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
        <h3 className="font-semibold text-lg mb-1">{nft.name}</h3>
        <p className="text-sm text-surface-600 mb-2">{nft.description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-500">
            Owner: {formatAddress(nft.owner_address)}
          </span>
          {nft.listed_price && (
            <span className="font-medium text-primary-700">
              {nft.listed_price} ALGO
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-surface-50">
        {isOwner ? (
          !nft.listed_price && (
            <Button 
              onClick={onList}
              className="w-full"
              variant="outline"
            >
              List for Sale
            </Button>
          )
        ) : (
          nft.listed_price && (
            <Button 
              onClick={onPurchase}
              className="w-full"
            >
              Purchase
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
};

export default NFTCard;