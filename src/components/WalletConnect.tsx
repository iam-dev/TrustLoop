import React, { useState } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { Wallet } from 'lucide-react';
import Button from './ui/Button';
import { formatAddress } from '../lib/utils';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  connected: boolean;
  address?: string;
}

const peraWallet = new PeraWalletConnect();

const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  connected,
  address,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const accounts = await peraWallet.connect();
      
      // Handle the case where user might cancel the connection
      if (accounts && accounts.length > 0) {
        onConnect(accounts[0]);
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsLoading(false);
    }
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
        <Button 
          variant="outline" 
          onClick={handleDisconnect}
          isLoading={isLoading}
          leftIcon={<Wallet size={16} />}
          className="wallet-button"
        >
          {formatAddress(address)}
        </Button>
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