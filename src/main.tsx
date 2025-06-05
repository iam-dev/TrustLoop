import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WalletProvider } from '@txnlab/use-wallet-react';
import { WalletId, NetworkId } from '@txnlab/use-wallet';
import { DeflyWalletConnect } from '@blockshake/defly-connect';
import { PeraWalletConnect } from '@perawallet/connect';
import App from './App.tsx';
import './index.css';

const walletProviders = {
  [WalletId.DEFLY]: {
    id: WalletId.DEFLY,
    name: 'Defly Wallet',
    connect: async () => new DeflyWalletConnect(),
  },
  [WalletId.PERA]: {
    id: WalletId.PERA,
    name: 'Pera Wallet',
    connect: async () => new PeraWalletConnect(),
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider
      value={{
        providers: walletProviders,
        defaultActiveNetwork: NetworkId.TestNet,
      }}
    >
      <App />
    </WalletProvider>
  </StrictMode>
);