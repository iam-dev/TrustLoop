-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: task_completions
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  -- Ensure each user completes a task only once
  UNIQUE(user_id, task_id)
);

-- Table 3: nfts
CREATE TABLE IF NOT EXISTS nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_wallet TEXT NOT NULL,
  task_id TEXT,
  metadata_url TEXT NOT NULL,
  asset_id BIGINT,
  nft_type TEXT, -- e.g., 'badge', 'art', 'reward'
  rarity TEXT, -- e.g., 'common', 'rare', 'legendary'
  title TEXT,
  description TEXT,
  image_url TEXT,
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_listed BOOLEAN DEFAULT FALSE
);

-- Table 4: marketplace_listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
  seller_wallet TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 5: tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('nft', 'algo', 'both')),
  reward_amount NUMERIC,
  nft_template_id TEXT,
  creator_wallet TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_nfts_owner_wallet ON nfts(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_nft_id ON marketplace_listings(nft_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);

-- Setup realtime for marketplace_listings and task_completions
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE task_completions;
