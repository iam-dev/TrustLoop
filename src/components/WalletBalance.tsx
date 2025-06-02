import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { formatReward } from '../lib/utils';

interface WalletBalanceProps {
  address?: string;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({ address }) => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    const fetchBalance = async () => {
      try {
        const response = await fetch(
          `https://testnet-idx.algonode.cloud/v2/accounts/${address}`
        );
        const data = await response.json();
        setBalance(data.account.amount / 1000000); // Convert microAlgos to Algos
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [address]);

  if (!address) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Wallet size={20} className="text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-surface-600">Wallet Balance</p>
            <p className="text-lg font-semibold">
              {loading ? '...' : formatReward(balance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalance;