import { supabase } from './supabase';
import { mintNFTReward } from './nftUtils';
import type { NFT } from './nftUtils';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'meme' | 'tutorial';
  reward: number;
  nft_reward?: {
    name: string;
    description: string;
    image_url: string;
    rarity: string;
  };
  timeEstimate: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TaskCompletion {
  id: string;
  wallet: string;
  task_id: string;
  completed_at: string;
  verified: boolean;
  reward_paid: boolean;
  nft_minted?: boolean;
  proof_hash?: string;
}

export async function completeTask(
  taskId: string,
  wallet: string
): Promise<{ success: boolean; nft?: NFT; error?: string }> {
  try {
    // Check if task was already completed
    const { data: existing } = await supabase
      .from('task_completions')
      .select()
      .eq('task_id', taskId)
      .eq('wallet', wallet)
      .single();

    if (existing) {
      return { success: false, error: 'Task already completed' };
    }

    // Record completion in Supabase
    const { error: completionError } = await supabase
      .from('task_completions')
      .insert({
        task_id: taskId,
        wallet,
        completed_at: new Date().toISOString(),
        verified: true,
        reward_paid: false
      });

    if (completionError) throw completionError;

    // Get task details to check for NFT reward
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (task?.nft_reward) {
      // Mint NFT reward
      const { success: mintSuccess, assetId } = await mintNFTReward(wallet, {
        ...task.nft_reward,
        task_id: taskId,
        completion_timestamp: new Date().toISOString()
      });

      if (mintSuccess && assetId) {
        // Update completion record with NFT info
        await supabase
          .from('task_completions')
          .update({ 
            nft_minted: true,
            nft_asset_id: assetId 
          })
          .eq('task_id', taskId)
          .eq('wallet', wallet);

        return { 
          success: true,
          nft: {
            id: assetId,
            ...task.nft_reward,
            owner_address: wallet,
            created_at: new Date().toISOString()
          }
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error completing task:', error);
    return { success: false, error: 'Failed to complete task' };
  }
}

export async function getUserCompletedTasks(wallet: string): Promise<TaskCompletion[]> {
  try {
    const { data, error } = await supabase
      .from('task_completions')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('wallet', wallet)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching completed tasks:', error);
    return [];
  }
}

export async function getTaskProgress(wallet: string): Promise<{
  completed: number;
  total: number;
  rewards: number;
}> {
  try {
    const [completionsResponse, tasksResponse] = await Promise.all([
      supabase
        .from('task_completions')
        .select('reward_paid, task:tasks(reward)')
        .eq('wallet', wallet),
      supabase
        .from('tasks')
        .select('count', { count: 'exact' })
    ]);

    const completions = completionsResponse.data || [];
    const totalTasks = tasksResponse.count || 0;
    const totalRewards = completions.reduce((sum, completion) => {
      return sum + (completion.task?.reward || 0);
    }, 0);

    return {
      completed: completions.length,
      total: totalTasks,
      rewards: totalRewards
    };
  } catch (error) {
    console.error('Error fetching task progress:', error);
    return { completed: 0, total: 0, rewards: 0 };
  }
}