import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WalletProvider, PROVIDER_ID, NetworkId } from '@txnlab/use-wallet-react';
import { DeflyWalletConnect } from '@blockshake/defly-connect';
import { PeraWalletConnect } from '@perawallet/connect';
import App from './App.tsx';
import './index.css';

const walletProviders = {
  [PROVIDER_ID.DEFLY]: {
    id: PROVIDER_ID.DEFLY,
    name: 'Defly Wallet',
    connect: async () => new DeflyWalletConnect(),
  },
  [PROVIDER_ID.PERA]: {
    id: PROVIDER_ID.PERA,
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