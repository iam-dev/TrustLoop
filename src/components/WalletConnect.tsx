import React, { useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { Wallet, Award, Check } from 'lucide-react';
import Button from './ui/Button';
import { formatAddress } from '../lib/utils';
import { mintWelcomeNFT } from '../lib/nftUtils';
import { Card, CardContent } from './ui/Card';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  connected: boolean;
  address?: string;
  isNewUser?: boolean;
}

const peraWallet = new PeraWalletConnect();

const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  connected,
  address,
  isNewUser = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeNFT, setShowWelcomeNFT] = useState(false);
  const [welcomeNFTMinted, setWelcomeNFTMinted] = useState(false);
  const [mintingNFT, setMintingNFT] = useState(false);
  const [mintedAssetId, setMintedAssetId] = useState<number | undefined>();
  
  useEffect(() => {
    // Check if this is a new user connection to offer welcome NFT
    if (connected && address && isNewUser) {
      setShowWelcomeNFT(true);
    }
  }, [connected, address, isNewUser]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const accounts = await peraWallet.connect();
      
      // Handle the case where user might cancel the connection
      if (accounts && accounts.length > 0) {
        onConnect(accounts[0]);
        // Show welcome NFT card to new users
        // In a real app, you would check if this is their first login
        setShowWelcomeNFT(true);
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const mintWelcomeBadge = async () => {
    if (!address) return;
    
    setMintingNFT(true);
    try {
      const result = await mintWelcomeNFT(address);
      if (result.success && result.assetId) {
        setWelcomeNFTMinted(true);
        setMintedAssetId(result.assetId);
      }
    } catch (error) {
      console.error('Error minting welcome NFT:', error);
    } finally {
      setMintingNFT(false);
    }
  };
  
  const closeWelcomeCard = () => {
    setShowWelcomeNFT(false);
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await peraWallet.disconnect();
      onDisconnect();
    } catch (error) {
      console.error('Disconnection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {connected && address ? (
        <>
          <Button 
            variant="outline" 
            onClick={handleDisconnect}
            isLoading={isLoading}
            leftIcon={<Wallet size={16} />}
            className="wallet-button"
          >
            {formatAddress(address)}
          </Button>
          
          {/* Welcome NFT Card */}
          {showWelcomeNFT && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full bg-white">
                <CardContent className="p-6">
                  {welcomeNFTMinted ? (
                    <div className="text-center">
                      <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} className="text-success-500" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Welcome NFT Minted!</h3>
                      <p className="text-surface-600 mb-4">
                        Your "TrustLoop Explorer Badge" has been added to your collection.
                      </p>
                      <div className="bg-surface-50 p-4 rounded-lg mb-4">
                        <img 
                          src="https://your-ipfs-gateway/welcome-badge.png" 
                          alt="TrustLoop Explorer Badge" 
                          className="h-32 w-32 mx-auto rounded-lg object-cover mb-2"
                        />
                        <p className="font-medium text-center">TrustLoop Explorer Badge</p>
                        <p className="text-xs text-surface-500 text-center">Asset ID: {mintedAssetId}</p>
                      </div>
                      <Button onClick={closeWelcomeCard} className="w-full">
                        View My NFTs
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award size={32} className="text-primary-500" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Welcome to TrustLoop!</h3>
                      <p className="text-surface-600 mb-6">
                        Mint your first NFT to commemorate joining our community. This exclusive badge will be added to your collection.
                      </p>
                      <div className="flex space-x-3">
                        <Button 
                          variant="outline" 
                          onClick={closeWelcomeCard} 
                          className="flex-1"
                        >
                          Skip
                        </Button>
                        <Button 
                          onClick={mintWelcomeBadge} 
                          isLoading={mintingNFT}
                          className="flex-1"
                        >
                          Mint Badge
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <Button 
          onClick={handleConnect} 
          isLoading={isLoading}
          leftIcon={<Wallet size={16} />}
          className="wallet-button"
        >
          Connect Wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;