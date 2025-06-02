import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Medal, 
  ArrowLeft, 
  RefreshCw,
  Crown,
  Users
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { formatAddress } from '../lib/utils';

interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  address: string;
  actionsCompleted: number;
  nftsEarned: number;
  avatarUrl?: string;
}

// Mock leaderboard data
const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    rank: 1,
    username: 'CryptoChampion',
    address: '7ZUECA7HFLZTXENRV24SHLU4AVPUTMTTDUFUBNBD64C73F3UHRTHAIOF6Q',
    actionsCompleted: 156,
    nftsEarned: 12,
    avatarUrl: 'https://images.pexels.com/photos/7242908/pexels-photo-7242908.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '2',
    rank: 2,
    username: 'BlockchainPro',
    address: 'MTHFSNXBMBD4U4BJFXFSPBYJTH5OYPBHHOT5FUGP7HETE3MHILHVPGTGNI',
    actionsCompleted: 142,
    nftsEarned: 10,
    avatarUrl: 'https://images.pexels.com/photos/7242756/pexels-photo-7242756.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '3',
    rank: 3,
    username: 'AlgoMaster',
    address: '2UBZKFR6RCZL7R24ZG327VKPTPJUPFM6WTG7PJG2ZJLU234F5RGXFLTAKA',
    actionsCompleted: 128,
    nftsEarned: 8,
    avatarUrl: 'https://images.pexels.com/photos/7242976/pexels-photo-7242976.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: '4',
    rank: 4,
    username: 'Web3Explorer',
    address: '4MYUUCHV2NWWX6U4WQWH7IQHP2BRGX7EWHPN6ASEQJWT7G5QIWYVXS3EWM',
    actionsCompleted: 115,
    nftsEarned: 7
  },
  {
    id: '5',
    rank: 5,
    username: 'TokenMaster',
    address: 'EDTMR2QKKHWMHXRDAY2GZXP4LXWSQB2ZZZH6SD64XMICQXKQWWVDFHNTJI',
    actionsCompleted: 98,
    nftsEarned: 6
  },
  {
    id: '6',
    rank: 6,
    username: 'CryptoNinja',
    address: 'BXMYUHK3Z7WXGD4WCKM7GGKSHWBK5YMPN5VWMCDR5QHUZWV3QVLZS2O3E4',
    actionsCompleted: 87,
    nftsEarned: 5
  },
  {
    id: '7',
    rank: 7,
    username: 'DeFiWhale',
    address: 'TMYUHK3Z7WXGD4WCKM7GGKSHWBK5YMPN5VWMCDR5QHUZWV3QVLZS2O3E4B',
    actionsCompleted: 76,
    nftsEarned: 4
  },
  {
    id: '8',
    rank: 8,
    username: 'AlgoTrader',
    address: 'XMYUHK3Z7WXGD4WCKM7GGKSHWBK5YMPN5VWMCDR5QHUZWV3QVLZS2O3E4T',
    actionsCompleted: 65,
    nftsEarned: 3
  }
];

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboard] = useState(mockLeaderboard);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshLeaderboard = async () => {
    setIsRefreshing(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-warning-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-surface-300" />;
      case 3:
        return <Medal className="h-6 w-6 text-warning-700" />;
      default:
        return <span className="text-surface-500 font-mono">{rank}</span>;
    }
  };

  const getRowStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-warning-50';
      case 2:
        return 'bg-surface-50';
      case 3:
        return 'bg-warning-50/50';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 to-primary-800 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 text-white">
          <div className="flex items-center mb-4 sm:mb-0">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mr-4 text-white hover:bg-white/10"
              leftIcon={<ArrowLeft size={20} />}
            >
              Back
            </Button>
            <h1 className="text-3xl font-bold flex items-center">
              <Trophy className="h-8 w-8 mr-3 text-warning-400" />
              Leaderboard
            </h1>
          </div>
          
          <Button
            variant="outline"
            onClick={refreshLeaderboard}
            isLoading={isRefreshing}
            className="border-white/20 text-white hover:bg-white/10"
            leftIcon={<RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="h-5 w-5 text-primary-400" />}
            label="Total Users"
            value="1,234"
          />
          <StatCard
            icon={<Trophy className="h-5 w-5 text-warning-400" />}
            label="Actions Completed"
            value="45,678"
          />
          <StatCard
            icon={<Medal className="h-5 w-5 text-accent-400" />}
            label="NFTs Earned"
            value="890"
          />
          <StatCard
            icon={<Crown className="h-5 w-5 text-warning-400" />}
            label="Active Challenges"
            value="12"
          />
        </div>

        {/* Leaderboard Table */}
        <Card className="overflow-hidden bg-white/95 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-surface-600">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-surface-600">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-surface-600 hidden sm:table-cell">Wallet</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-surface-600">Actions</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-surface-600">NFTs</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr 
                      key={entry.id}
                      className={`border-b border-surface-200 hover:bg-surface-50 transition-colors ${getRowStyle(entry.rank)}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            {entry.avatarUrl && <AvatarImage src={entry.avatarUrl} alt={entry.username} />}
                            <AvatarFallback>
                              {entry.username.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{entry.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell text-surface-600">
                        {formatAddress(entry.address)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {entry.actionsCompleted.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {entry.nftsEarned.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value }) => {
  return (
    <Card className="bg-white/10 border-white/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-white/10 p-3">
            {icon}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white/60">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;