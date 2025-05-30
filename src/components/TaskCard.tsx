import React from 'react';
import { Play, Award, ChevronRight } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter, 
  CardTitle, 
  CardDescription 
} from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';

export interface TaskProps {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'meme' | 'tutorial';
  reward: number;
  timeEstimate: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed?: boolean;
  locked?: boolean;
  onSelect: (id: string) => void;
}

const TaskCard: React.FC<TaskProps> = ({
  id,
  title,
  description,
  type,
  reward,
  timeEstimate,
  difficulty,
  completed,
  locked,
  onSelect,
}) => {
  const taskIcons = {
    video: <Play size={18} className="text-primary-600" />,
    meme: <span className="text-xl">🎭</span>,
    tutorial: <span className="text-xl">📚</span>,
  };

  const difficultyVariants = {
    easy: 'success',
    medium: 'warning',
    hard: 'error',
  };

  return (
    <Card hover onClick={() => !locked && onSelect(id)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-surface-100 rounded-lg">
              {taskIcons[type]}
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
          {completed && (
            <Badge variant="success" className="flex items-center space-x-1">
              <Award size={12} />
              <span>Completed</span>
            </Badge>
          )}
          {locked && (
            <Badge variant="default" className="flex items-center space-x-1">
              <span className="text-xs">🔒</span>
              <span>Premium</span>
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex space-x-2">
            <Badge variant={difficultyVariants[difficulty as keyof typeof difficultyVariants]}>
              {difficulty}
            </Badge>
            <Badge variant="default">
              {timeEstimate}
            </Badge>
          </div>
          <div className="flex items-center font-medium text-primary-700">
            <Award size={16} className="mr-1" />
            {reward} ALGO
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-surface-500">
          {locked ? 'Unlock with premium subscription' : 'Complete for on-chain rewards'}
        </div>
        <Button 
          size="sm" 
          rightIcon={<ChevronRight size={16} />}
          disabled={locked}
        >
          Start
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaskCard;