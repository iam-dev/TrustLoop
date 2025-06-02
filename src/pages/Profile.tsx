import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Card, CardContent } from '../components/ui/Card';
// Import Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import NFTGallery from '../components/NFTGallery';
import useAuthStore from '../store/useAuthStore';
import { formatAddress } from '../lib/utils';
import { Shield, Trophy, Clock, Star, Image, Settings, Edit3 } from 'lucide-react';
import Button from '../components/ui/Button';

const Profile: React.FC = () => {
  const { isConnected, address } = useAuthStore();
  const { walletAddress } = useParams<{ walletAddress: string }>();
  const profileAddress = walletAddress || address;
  const isOwnProfile = address === profileAddress;
  
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    nftsOwned: 0,
    reputation: 0,
    joinedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  });
  
  useEffect(() => {
    // Only run if we have a valid profile address
    if (profileAddress) {
      // In a real implementation, we would fetch this data from Supabase or Algorand indexer
      fetchUserStats(profileAddress);
    }
  }, [profileAddress]);
  
  const fetchUserStats = async (walletAddress: string) => {
    // Log the wallet address for debugging
    console.log('Fetching stats for wallet:', walletAddress);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock stats - in a real implementation, these would come from Supabase or Algorand indexer
      setStats({
        tasksCompleted: Math.floor(Math.random() * 20),
        nftsOwned: Math.floor(Math.random() * 10),
        reputation: Math.floor(Math.random() * 100),
        joinedDate: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };
  
  // Redirect if not connected and trying to view profile
  if (!isConnected && !walletAddress) {
    return <Navigate to="/" />;
  }
  
  // Mock profile data
  const mockUser = {
    username: `TrustLooper_${profileAddress?.substring(0, 4)}`,
    bio: 'Blockchain explorer and NFT enthusiast. Completing tasks in the TrustLoop ecosystem.',
    avatar: 'https://source.boringavatars.com/marble/120/' + profileAddress
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-8">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary-600 to-accent-600"></div>
          <CardContent className="relative pt-0">
            <div className="flex flex-col md:flex-row gap-6 -mt-12">
              <Avatar className="w-24 h-24 border-4 border-white bg-surface-100 relative">
                <AvatarImage src={mockUser.avatar} />
                <AvatarFallback className="text-xl">
                  {profileAddress?.substring(0, 2)}
                </AvatarFallback>
                {isOwnProfile && (
                  <button className="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-1">
                    <Edit3 size={12} />
                  </button>
                )}
              </Avatar>
              
              <div className="flex-grow pt-6 md:pt-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h1 className="text-2xl font-bold">{mockUser.username}</h1>
                    <p className="text-surface-600">{formatAddress(profileAddress)}</p>
                  </div>
                  {isOwnProfile && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      leftIcon={<Settings size={14} />}
                      className="mt-2 md:mt-0"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-surface-700">{mockUser.bio}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <Trophy size={20} className="text-warning-500" />
                    </div>
                    <div className="font-bold">{stats.tasksCompleted}</div>
                    <div className="text-xs text-surface-500">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <Image size={20} className="text-primary-500" />
                    </div>
                    <div className="font-bold">{stats.nftsOwned}</div>
                    <div className="text-xs text-surface-500">NFTs</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <Star size={20} className="text-success-500" />
                    </div>
                    <div className="font-bold">{stats.reputation}</div>
                    <div className="text-xs text-surface-500">Reputation</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <Clock size={20} className="text-accent-500" />
                    </div>
                    <div className="font-bold">
                      <span className="text-xs">Joined</span>
                    </div>
                    <div className="text-xs text-surface-500">{stats.joinedDate.split(',')[0]}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Profile Content */}
        <Tabs defaultValue="nfts" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="nfts">
              <Image size={16} className="mr-2" /> NFTs
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Clock size={16} className="mr-2" /> Activity
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Shield size={16} className="mr-2" /> Achievements
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="nfts" className="min-h-[300px]">
            <NFTGallery walletAddress={profileAddress} />
          </TabsContent>
          
          <TabsContent value="activity" className="min-h-[300px]">
            <Card>
              <CardContent className="p-6 text-center">
                <Clock size={48} className="mx-auto mb-4 text-surface-300" />
                <h3 className="text-xl font-semibold mb-2">Activity Coming Soon</h3>
                <p className="text-surface-600">
                  We're working on tracking all your on-chain activity
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="achievements" className="min-h-[300px]">
            <Card>
              <CardContent className="p-6 text-center">
                <Shield size={48} className="mx-auto mb-4 text-surface-300" />
                <h3 className="text-xl font-semibold mb-2">Achievements Coming Soon</h3>
                <p className="text-surface-600">
                  Complete tasks to earn achievements and increase your reputation
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
