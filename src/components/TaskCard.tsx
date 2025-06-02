import React, { useState } from 'react';
import { Play, Award, ChevronRight, Check, Loader } from 'lucide-react';
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
import { createTaskVerificationTxn, signTransaction, submitAndMonitorTransaction, TransactionStatus } from '../lib/transactionUtils';
import { toast } from '../lib/toast';
import { useWallet } from '@txnlab/use-wallet';

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
  onCompleted?: (id: string) => void;
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
  onCompleted,
}) => {
  const [txStatus, setTxStatus] = useState<TransactionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { activeAccount } = useWallet();
  const taskIcons = {
    video: <Play size={18} className="text-primary-600" />,
    meme: <span className="text-xl">🎭</span>,
    tutorial: <span className="text-xl">📚</span>,
  };

  const difficultyVariants: Record<string, 'success' | 'warning' | 'error' | 'default' | 'primary' | 'secondary'> = {
    easy: 'success',
    medium: 'warning',
    hard: 'error',
  };

  // Handle verify task completion on blockchain
  const handleVerifyCompletion = async () => {
    if (!activeAccount || !activeAccount.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setTxStatus('pending');

      // Create transaction for task verification
      const txn = await createTaskVerificationTxn(activeAccount.address, id);
      
      // Sign transaction with user's wallet
      const signedTxn = await signTransaction(txn, activeAccount.address);
      
      // Submit and monitor transaction
      await submitAndMonitorTransaction(signedTxn, (update) => {
        setTxStatus(update.status);
        
        if (update.status === 'confirmed') {
          toast.success('Task completion verified on blockchain!');
          if (onCompleted) onCompleted(id);
        } else if (update.status === 'failed') {
          toast.error('Transaction failed: ' + update.message);
        }
      });
    } catch (error) {
      console.error('Error verifying task completion:', error);
      toast.error('Failed to verify task: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Determine button text and icon based on status
  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader size={16} className="animate-spin mr-1" />
          {txStatus === 'pending' ? 'Preparing...' : 
           txStatus === 'confirming' ? 'Confirming...' : 'Processing...'}
        </>
      );
    }
    
    if (completed) {
      return (
        <>
          <Check size={16} className="mr-1" />
          Completed
        </>
      );
    }
    
    return (
      <>
        Start
        <ChevronRight size={16} className="ml-1" />
      </>
    );
  };

  return (
    <Card hover onClick={() => !locked && !loading && onSelect(id)}>
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
          disabled={locked || loading}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card onClick from firing
            if (!completed) handleVerifyCompletion();
          }}
        >
          {getButtonContent()}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaskCard;