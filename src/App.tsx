import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BoltBanner from './components/BoltBanner';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import useAuthStore from './store/useAuthStore';

function App() {
  const { isConnected, address, connect, disconnect } = useAuthStore();

  // Effect to check if user has previously connected their wallet
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      connect(savedAddress);
    }
  }, [connect]);

  // Save connected address to localStorage
  useEffect(() => {
    if (address) {
      localStorage.setItem('walletAddress', address);
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, [address]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-surface-50">
        <Header 
          isConnected={isConnected} 
          address={address}
          onConnect={connect}
          onDisconnect={disconnect}
        />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route 
              path="/dashboard" 
              element={<Dashboard isConnected={isConnected} address={address} />} 
            />
            <Route 
              path="/rewards" 
              element={
                isConnected ? <div className="container mx-auto p-8">Rewards Page (Coming Soon)</div> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/leaderboard" 
              element={<div className="container mx-auto p-8">Leaderboard Page (Coming Soon)</div>} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <BoltBanner />
      </div>
    </Router>
  );
}

export default App;