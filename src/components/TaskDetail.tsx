import React, { useState } from 'react';
import { Play, Award, Clock, ChevronRight, CheckCircle, Video, BookOpen, Laugh, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { completeTask } from '../lib/taskUtils';
import type { Task } from '../lib/taskUtils';
import type { NFT } from '../lib/nftUtils';

interface TaskDetailProps {
  task: Task;
  onComplete: (taskId: string, reward: number, nft?: NFT) => void;
  wallet?: string;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task, onComplete, wallet }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [taskStarted, setTaskStarted] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);

  const handleStartTask = () => {
    setTaskStarted(true);
  };

  const handleComplete = async () => {
    if (!wallet) return;
    
    setIsCompleting(true);
    try {
      const result = await completeTask(task.id, wallet);
      if (result.success) {
        setTaskCompleted(true);
        onComplete(task.id, task.reward, result.nft);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const getTaskIcon = () => {
    switch (task.type) {
      case 'video':
        return <Video size={24} className="text-primary-600 mr-3" />;
      case 'tutorial':
        return <BookOpen size={24} className="text-primary-600 mr-3" />;
      case 'meme':
        return <Laugh size={24} className="text-primary-600 mr-3" />;
      default:
        return <Award size={24} className="text-primary-600 mr-3" />;
    }
  };

  if (taskCompleted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <CheckCircle size={64} className="text-success-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Task Completed!</h2>
          <p className="text-surface-600 mb-6">You've earned {task.reward} ALGO{task.nft_reward ? ' and an exclusive NFT!' : '!'}</p>
          
          {task.nft_reward && (
            <div className="my-6">
              <img 
                src={task.nft_reward.image_url} 
                alt="NFT Reward" 
                className="h-32 w-32 mx-auto rounded-lg object-cover mb-2"
              />
              <p className="font-medium">{task.nft_reward.name}</p>
              <p className="text-sm text-surface-500">{task.nft_reward.description}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 bg-surface-50 flex justify-center">
          <Button onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

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
          {taskStarted && task.type === 'video' ? (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                className="w-full h-full" 
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Task Video"
              ></iframe>
            </div>
          ) : taskStarted && task.type === 'meme' ? (
            <div className="p-4 bg-surface-50 rounded-lg">
              <h3 className="font-medium mb-2">Create a Meme</h3>
              <p className="text-sm text-surface-600 mb-4">Use your creativity to make a blockchain-themed meme!</p>
              <div className="bg-white p-4 rounded border border-surface-200 mb-4">
                <img 
                  src="https://www.liveabout.com/thmb/YCJmu1khSJo8kMYM090QCd7iSXc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/overlyattachedgirlfriend-5ade58713de423003673cb89.jpg" 
                  alt="Meme Template" 
                  className="mx-auto max-h-64"
                />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" className="mr-2">
                  Choose Template
                </Button>
                <Button variant="outline">
                  Upload Image
                </Button>
              </div>
            </div>
          ) : taskStarted && task.type === 'tutorial' ? (
            <div className="p-4 bg-surface-50 rounded-lg">
              <h3 className="font-medium mb-2">Tutorial Content</h3>
              <p className="text-sm text-surface-600 mb-4">Learn about blockchain fundamentals:</p>
              <ul className="list-disc pl-5 mb-4 space-y-1 text-sm">
                <li>What is a blockchain?</li>
                <li>How do transactions work?</li>
                <li>Understanding consensus mechanisms</li>
                <li>Introduction to smart contracts</li>
              </ul>
              <Button variant="outline" size="sm" className="flex items-center" onClick={() => window.open('https://developer.algorand.org/', '_blank')}>
                <ExternalLink size={14} className="mr-1" />
                View Full Tutorial
              </Button>
            </div>
          ) : (
            <div className="aspect-video bg-surface-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-surface-200 transition-colors" onClick={handleStartTask}>
              <div className="text-center">
                <Play size={48} className="text-surface-400 mx-auto mb-2" />
                <span className="text-surface-600">Start Task</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-surface-50 rounded-lg">
            <div className="flex items-center">
              {getTaskIcon()}
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
          {taskStarted ? 'Complete the task to earn rewards' : 'Start the task first'}
        </div>
        <Button
          onClick={taskStarted ? handleComplete : handleStartTask}
          isLoading={isCompleting}
          disabled={!wallet || isCompleting}
          rightIcon={<ChevronRight size={16} />}
        >
          {taskStarted ? 'Complete Task' : 'Start Task'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaskDetail;