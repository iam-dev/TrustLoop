import React, { useState, useEffect } from 'react';
import { Award, Gift, Clock, Star, AlertCircle, ArrowRight, Filter, Search, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import useAuthStore from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskWithCompletion = Task & { 
  isCompleted?: boolean; 
  completionDate?: string;
  // Define estimated_time if it's not in the database type
  estimated_time?: string;
};

const Rewards: React.FC = () => {
  const { address, isConnected } = useAuthStore();
  const [tasks, setTasks] = useState<TaskWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadTasks();
      
      // Subscribe to task_completions changes
      const subscription = supabase
        .channel('task_completion_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'task_completions' 
        }, () => {
          loadTasks();
        })
        .subscribe();
  
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isConnected, address]);

  const loadTasks = async () => {
    if (!address) return;
    
    setLoading(true);
    
    try {
      // Get all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('difficulty', { ascending: true });
        
      if (tasksError) throw tasksError;
      
      // Get user's completed tasks
      const { data: completionsData, error: completionsError } = await supabase
        .from('task_completions')
        .select('task_id, completed_at')
        .eq('user_wallet_address', address)
        .eq('verified', true);
      
      if (completionsError) throw completionsError;
      
      // Combine data to show completion status
      const tasksWithCompletion = tasksData.map(task => {
        const completion = completionsData?.find(c => c.task_id === task.id);
        return {
          ...task,
          isCompleted: !!completion,
          completionDate: completion?.completed_at
        };
      });
      
      setTasks(tasksWithCompletion);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTasks = async () => {
    setIsRefreshing(true);
    await loadTasks();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredTasks = tasks
    .filter(task => {
      // Apply filter
      if (filter === 'completed') return task.isCompleted;
      if (filter === 'available') return !task.isCompleted;
      return true;
    })
    .filter(task => {
      // Apply search
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      );
    });

  // This function was moved outside of component to be accessible to TaskCard

  if (!isConnected) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <AlertCircle className="h-16 w-16 text-warning-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Wallet Connection Required</h2>
        <p className="text-surface-600 mb-6 max-w-md mx-auto">
          Please connect your Algorand wallet to access the Rewards page and start earning rewards.
        </p>
        <Button variant="primary" size="lg">
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Award className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-2xl font-bold">Rewards & Tasks</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-surface-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              className="pl-10 pr-4 py-2 border border-surface-200 rounded-md w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={refreshTasks}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="animate-spin h-4 w-4" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex overflow-x-auto mb-6 pb-2">
        <FilterButton 
          label="All Tasks" 
          isActive={filter === null} 
          onClick={() => setFilter(null)} 
        />
        <FilterButton 
          label="Available" 
          isActive={filter === 'available'} 
          onClick={() => setFilter('available')}
        />
        <FilterButton 
          label="Completed" 
          isActive={filter === 'completed'} 
          onClick={() => setFilter('completed')}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="animate-spin h-8 w-8 text-primary-500" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-surface-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-900 mb-1">No tasks found</h3>
          <p className="text-surface-500">
            {searchQuery ? 'Try a different search term' : 
              filter ? 'Try a different filter' : 'Check back later for new tasks'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-full mr-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
      }`}
    >
      {label}
    </button>
  );
};

interface TaskCardProps {
  task: TaskWithCompletion;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  return (
    <Card className={`overflow-hidden transition-all duration-200 ${
      task.isCompleted ? 'bg-surface-50 border-success-200' : ''
    }`}>
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <Badge 
              variant={getDifficultyVariant(task.difficulty)} 
              className="mb-2"
            >
              {task.difficulty.toUpperCase()}
            </Badge>
            {task.isCompleted && (
              <Badge variant="success">Completed</Badge>
            )}
          </div>
          
          <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
          <p className="text-surface-600 text-sm mb-4">{task.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getRewardTypeIcon(task.reward_type || 'algo')}
              <span className="ml-1 text-sm font-medium">
                {task.reward_amount} {task.reward_type?.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center text-surface-500 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <span>{task.estimated_time}</span>
            </div>
          </div>
        </div>
        
        <div className={`border-t ${task.isCompleted ? 'border-success-200' : 'border-surface-200'} p-4`}>
          {task.isCompleted ? (
            <div className="flex justify-between items-center">
              <span className="text-sm text-success-600 font-medium">
                Completed on {new Date(task.completionDate!).toLocaleDateString()}
              </span>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}>
                View Reward
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" className="w-full">
              Start Task
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to get the appropriate icon for reward type
const getRewardTypeIcon = (type: string) => {
  switch (type) {
    case 'nft':
      return <Star className="h-4 w-4 text-warning-500" />;
    case 'algo':
      return <Award className="h-4 w-4 text-primary-500" />;
    case 'badge':
      return <Gift className="h-4 w-4 text-success-500" />;
    default:
      return <Award className="h-4 w-4 text-primary-500" />;
  }
};

const getDifficultyVariant = (difficulty: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'success';
    case 'medium':
      return 'warning';
    case 'hard':
      return 'error';
    default:
      return 'default';
  }
};

export default Rewards;
