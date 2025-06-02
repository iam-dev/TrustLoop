import React, { useState } from 'react';
import { Play, Award, Clock, ChevronRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { completeTask } from '../lib/taskUtils';
import type { Task } from '../lib/taskUtils';

interface TaskDetailProps {
  task: Task;
  onComplete: (taskId: string) => void;
  wallet?: string;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task, onComplete, wallet }) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (!wallet) return;
    
    setIsCompleting(true);
    try {
      const result = await completeTask(task.id, wallet);
      if (result.success) {
        onComplete(task.id);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
            <p className="text-surface-600">{task.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={task.difficulty === 'easy' ? 'success' : task.difficulty === 'medium' ? 'warning' : 'error'}>
              {task.difficulty}
            </Badge>
            <Badge variant="primary" className="flex items-center">
              <Clock size={14} className="mr-1" />
              {task.timeEstimate}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {task.type === 'video' && (
            <div className="aspect-video bg-surface-100 rounded-lg flex items-center justify-center">
              <Play size={48} className="text-surface-400" />
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-surface-50 rounded-lg">
            <div className="flex items-center">
              <Award size={24} className="text-primary-600 mr-3" />
              <div>
                <p className="font-medium">Reward</p>
                <p className="text-sm text-surface-600">
                  {task.reward} ALGO {task.nft_reward && '+ NFT Badge'}
                </p>
              </div>
            </div>
            {task.nft_reward && (
              <img 
                src={task.nft_reward.image_url} 
                alt="NFT Reward" 
                className="h-16 w-16 rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 bg-surface-50 flex justify-between items-center">
        <div className="text-sm text-surface-600">
          Complete the task to earn rewards
        </div>
        <Button
          onClick={handleComplete}
          isLoading={isCompleting}
          disabled={!wallet || isCompleting}
          rightIcon={<ChevronRight size={16} />}
        >
          Complete Task
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaskDetail;