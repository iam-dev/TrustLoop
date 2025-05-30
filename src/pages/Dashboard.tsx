import React, { useState } from 'react';
import { 
  BookOpen, 
  Video, 
  Laugh, 
  Search, 
  Award, 
  RefreshCw,
  Filter
} from 'lucide-react';
import TaskCard, { TaskProps } from '../components/TaskCard';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { formatAddress, formatReward } from '../lib/utils';

interface DashboardProps {
  address?: string;
  isConnected: boolean;
}

// Mock tasks data
const MOCK_TASKS: TaskProps[] = [
  {
    id: '1',
    title: 'Watch Introduction Video',
    description: 'Learn about blockchain rewards and how TrustLoop works',
    type: 'video',
    reward: 5,
    timeEstimate: '3 min',
    difficulty: 'easy',
    onSelect: () => {},
  },
  {
    id: '2',
    title: 'Complete Blockchain Basics',
    description: 'Learn the fundamentals of blockchain technology',
    type: 'tutorial',
    reward: 10,
    timeEstimate: '10 min',
    difficulty: 'medium',
    onSelect: () => {},
  },
  {
    id: '3',
    title: 'Create Your First Meme',
    description: 'Generate an AI meme and share it with the community',
    type: 'meme',
    reward: 15,
    timeEstimate: '5 min',
    difficulty: 'easy',
    onSelect: () => {},
  },
  {
    id: '4',
    title: 'Advanced Smart Contracts',
    description: 'Deep dive into Algorand smart contracts and applications',
    type: 'tutorial',
    reward: 25,
    timeEstimate: '20 min',
    difficulty: 'hard',
    onSelect: () => {},
    locked: true,
  },
  {
    id: '5',
    title: 'Watch Developer AMA',
    description: 'Learn from our development team in this recorded session',
    type: 'video',
    reward: 8,
    timeEstimate: '15 min',
    difficulty: 'medium',
    onSelect: () => {},
  },
  {
    id: '6',
    title: 'Create Weekly Challenge Meme',
    description: 'Create a meme based on this week\'s theme: "Future of DeFi"',
    type: 'meme',
    reward: 20,
    timeEstimate: '8 min',
    difficulty: 'medium',
    onSelect: () => {},
    locked: true,
  },
];

const Dashboard: React.FC<DashboardProps> = ({ address, isConnected }) => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTaskSelect = (id: string) => {
    // In a real app, this would navigate to the task detail page
    console.log(`Selected task: ${id}`);
  };

  const handleFilterChange = (filter: string | null) => {
    setSelectedFilter(filter === selectedFilter ? null : filter);
  };

  const refreshTasks = () => {
    setIsRefreshing(true);
    // Simulate a refresh delay
    setTimeout(() => {
      // In a real app, this would fetch fresh tasks from the API
      setIsRefreshing(false);
    }, 1000);
  };

  const filteredTasks = tasks
    .filter(task => 
      selectedFilter ? task.type === selectedFilter : true
    )
    .filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="container mx-auto px-4 py-8">
      {!isConnected ? (
        <div className="bg-surface-100 rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet to Start</h2>
          <p className="text-surface-600 mb-6">
            Connect your Algorand wallet to access tasks and earn rewards
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* User Stats */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Avatar 
                  size="lg"
                  fallback={address?.substring(0, 2) || 'AL'}
                />
                <div className="ml-4">
                  <h2 className="text-xl font-semibold">Welcome back!</h2>
                  <p className="text-surface-500">
                    {formatAddress(address)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <StatsCard 
                  label="Tasks Completed" 
                  value="3" 
                  icon={<BookOpen size={20} className="text-primary-600" />} 
                />
                <StatsCard 
                  label="Total Earned" 
                  value={formatReward(30)} 
                  icon={<Award size={20} className="text-primary-600" />} 
                />
                <StatsCard 
                  label="NFTs Earned" 
                  value="1" 
                  icon={<Award size={20} className="text-primary-600" />} 
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <span>Recent Activity</span>
              </h3>
              <div className="space-y-4">
                <ActivityItem 
                  type="completed"
                  task="Watch Introduction Video"
                  time="2 hours ago"
                  reward={5}
                />
                <ActivityItem 
                  type="earned"
                  task="NFT Badge: Early Adopter"
                  time="1 day ago"
                  reward={0}
                  isNFT
                />
                <ActivityItem 
                  type="completed"
                  task="Complete Blockchain Basics"
                  time="2 days ago"
                  reward={10}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Tasks Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">Available Tasks</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400" size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                className="input pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                leftIcon={<Filter size={16} />}
                className="hidden sm:flex"
              >
                Filter
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                leftIcon={<RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />}
                onClick={refreshTasks}
                isLoading={isRefreshing}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterButton 
            label="All Tasks" 
            isActive={selectedFilter === null} 
            onClick={() => handleFilterChange(null)}
          />
          <FilterButton 
            label="Videos" 
            isActive={selectedFilter === 'video'} 
            onClick={() => handleFilterChange('video')}
            icon={<Video size={14} />} 
          />
          <FilterButton 
            label="Tutorials" 
            isActive={selectedFilter === 'tutorial'} 
            onClick={() => handleFilterChange('tutorial')}
            icon={<BookOpen size={14} />} 
          />
          <FilterButton 
            label="Memes" 
            isActive={selectedFilter === 'meme'} 
            onClick={() => handleFilterChange('meme')}
            icon={<Laugh size={14} />} 
          />
        </div>
        
        {/* Task Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              {...task} 
              onSelect={handleTaskSelect}
            />
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-surface-500 text-lg">No tasks match your filters</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSelectedFilter(null);
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon }) => {
  return (
    <div className="bg-surface-50 rounded-lg p-4">
      <div className="flex items-center mb-2">
        {icon}
        <span className="text-sm font-medium text-surface-500 ml-2">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

interface ActivityItemProps {
  type: 'completed' | 'earned';
  task: string;
  time: string;
  reward: number;
  isNFT?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ 
  type, 
  task, 
  time, 
  reward,
  isNFT = false
}) => {
  return (
    <div className="flex items-center">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
        type === 'completed' ? 'bg-primary-100 text-primary-700' : 'bg-accent-100 text-accent-700'
      }`}>
        {type === 'completed' ? <BookOpen size={16} /> : <Award size={16} />}
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium">{task}</p>
        <div className="flex items-center text-xs text-surface-500">
          <span>{time}</span>
          {(reward > 0 || isNFT) && (
            <>
              <span className="mx-1">•</span>
              <Badge variant={isNFT ? 'secondary' : 'primary'} className="text-xs">
                {isNFT ? 'NFT' : `+${reward} ALGO`}
              </Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({ 
  label, 
  isActive, 
  onClick,
  icon
}) => {
  return (
    <button
      className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${
        isActive 
          ? 'bg-primary-100 text-primary-800' 
          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
      }`}
      onClick={onClick}
    >
      {icon && icon}
      {label}
    </button>
  );
};

export default Dashboard;