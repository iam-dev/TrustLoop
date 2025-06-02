# TrustLoop Algorand Smart Contracts

This directory contains PyTeal smart contracts for the TrustLoop dApp, enabling proof-of-action verification, NFT minting, and marketplace functionality on the Algorand blockchain.

## Contract Overview

1. **Proof-of-Action Contract (`proof_of_action.py`)**
   - Records task completions in user's local state
   - Prevents duplicate task submissions
   - Verifies task completion for NFT minting eligibility

2. **NFT Minting Contract (`nft_minting.py`)**
   - Mints ARC3 NFTs as rewards for completed tasks
   - Verifies proof-of-action before allowing minting
   - Stores task metadata including title, completion time, and rarity

3. **NFT Marketplace Contract (`marketplace.py`)**
   - Enables listing TrustLoop NFTs for sale
   - Facilitates NFT purchases with ALGO
   - Automatically transfers assets and payments
   - Enforces a 2% creator royalty

## Deployment Instructions

### Prerequisites

- Python 3.10+
- [AlgoKit](https://github.com/algorandfoundation/algokit-cli)
- Algorand Python SDK: `pip install py-algorand-sdk`
- PyTeal: `pip install pyteal`
- Your TrustLoop wallet connected to TestNet (for production deployment)
- Funded TestNet account (for production deployment)

### Compilation

Compile the PyTeal contracts to TEAL:

```bash
cd contracts
python proof_of_action.py
python nft_minting.py
python marketplace.py
```

This will generate the following TEAL files:
- `proof_of_action_approval.teal` and `proof_of_action_clear.teal`
- `nft_minting_approval.teal` and `nft_minting_clear.teal`
- `marketplace_approval.teal` and `marketplace_clear.teal`

## Testing with Local Algorand Node

Testing smart contracts locally before deploying to TestNet or MainNet is a best practice for development. The TrustLoop contracts include a comprehensive test suite designed to work with a local Algorand network.

### Setting Up a Local Algorand Node

TrustLoop includes a Docker Compose configuration for quickly setting up a local Algorand development environment.

#### Option 1: Using the Test Helper Script (Recommended)

We've created a helper script that handles starting the sandbox, running tests, and automatic account funding:

```bash
# Navigate to the contracts directory
cd contracts

# Make the script executable (first time only)
chmod +x scripts/sandbox_test.sh
chmod +x scripts/fund_test_accounts.sh

# Start sandbox and run all tests with automatic funding
./scripts/sandbox_test.sh

# Or use individual commands:
./scripts/sandbox_test.sh start  # Only start the sandbox
./scripts/sandbox_test.sh test   # Only run tests (assumes sandbox is running)
./scripts/sandbox_test.sh stop   # Stop the sandbox containers
./scripts/sandbox_test.sh clean  # Stop and remove all sandbox data
```

**Note on Account Funding:** The `sandbox_test.sh` script automatically handles funding test accounts by:
1. Starting the Algorand sandbox if not already running
2. Running the tests to identify accounts that need funding
3. Using the `fund_test_accounts.sh` script to extract and fund these accounts
4. Re-running the tests after accounts are funded

This eliminates the need to manually fund accounts for testing and ensures a smooth testing experience.

If you encounter account funding issues, you can directly run the funding script:

```bash
# Run funding script to identify and fund accounts from test output
./scripts/fund_test_accounts.sh
```

#### Option 2: Manual Docker Compose Setup

1. **Start the Algorand Sandbox using Docker Compose**

   ```bash
   # From the TrustLoop project root
   docker-compose up -d
   ```

2. **Configure Environment for Local Testing**

   The Docker Compose setup automatically configures these values, but if you're using a custom setup, create a `.env.local` file in the contracts directory:

   ```
   ALGOD_TOKEN="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
   ALGOD_SERVER="http://localhost"
   ALGOD_PORT="4001"
   INDEXER_SERVER="http://localhost"
   INDEXER_PORT="8980"
   ```

### Running the Unit Tests

The TrustLoop contracts include unit tests for all major functionality. These tests use the local Algorand node for realistic but isolated testing.

1. **Activate your Python virtual environment**

   ```bash
   cd /Users/in615bac/Documents/TrustLoop/TrustLoop/contracts
   source venv/bin/activate
   ```

2. **Update test configuration**

   Open `/Users/in615bac/Documents/TrustLoop/TrustLoop/contracts/tests/test_utils.py` and update the Algorand client constants to use your local node:

   ```python
   # Constants for testing with local node
   ALGOD_ADDRESS = "http://localhost:4001"
   ALGOD_TOKEN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
   ```

3. **Run all tests**

   ```bash
   python -m tests.run_tests
   ```

4. **Run specific test files**

   ```bash
   # Test only the marketplace contract
   python -m tests.test_marketplace
   
   # Test only the proof-of-action contract
   python -m tests.test_proof_of_action
   
   # Test only the NFT minting contract
   python -m tests.test_nft_minting
   ```

### Mock Accounts vs. Real Accounts

The test suite automatically creates test accounts with funding. When using a local node:

- Test accounts are automatically funded in the setup phase
- No external dispenser is needed
- Transactions settle almost instantly

### Interpreting Test Results

Test output includes:

- Contract deployment verification
- Transaction confirmations
- Functional testing of all contract methods
- Verification of state changes
- Error case testing

Successful tests will show output like:

```
Ran 12 tests in 5.231s

OK
```

If tests fail with a "needs funding" message when using a local node, ensure your Algorand Sandbox is running and the connection details are correct.

### Debugging Failed Tests

To get more detailed output for debugging:

```bash
# Run with verbose output
python -m tests.run_tests -v

# Run a specific test case
python -m tests.test_marketplace.MarketplaceTest.test_list_nft
```

### Deploying to TestNet with Your TrustLoop Wallet

Follow these steps to deploy the TrustLoop contracts to Algorand TestNet using your wallet:

#### 1. Set Up Environment

Create a `.env` file in the contracts directory with your TestNet wallet information:

```
MNEMONIC="your 25-word mnemonic here"
ALGOD_TOKEN=""
ALGOD_SERVER="https://testnet-api.algonode.cloud"
ALGOD_PORT=""
INDEXER_SERVER="https://testnet-idx.algonode.cloud"
CREATOR_ADDRESS="your TrustLoop wallet address"
```

#### 2. Create Deployment Script

Save this as `deploy_contracts.py` in the contracts directory:

```python
import os
import base64
from algosdk import account, encoding, mnemonic
from algosdk.v2client import algod, indexer
from algosdk.future import transaction
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Read mnemonic from environment or configuration
mnemonic_phrase = os.getenv("MNEMONIC")
if not mnemonic_phrase:
    raise ValueError("MNEMONIC environment variable is not set")

# Get account from mnemonic
private_key = mnemonic.to_private_key(mnemonic_phrase)
address = account.address_from_private_key(private_key)
print(f"Using address: {address}")

# Initialize client
algod_address = os.getenv("ALGOD_SERVER")
algod_token = os.getenv("ALGOD_TOKEN")
headers = {"X-API-Key": algod_token} if algod_token else None
algod_client = algod.AlgodClient(algod_token, algod_address, headers)

def compile_program(client, source_code):
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response["result"])

def wait_for_confirmation(client, txid):
    last_round = client.status().get("last-round")
    txinfo = client.pending_transaction_info(txid)
    while not (txinfo.get("confirmed-round") and txinfo.get("confirmed-round") > 0):
        print("Waiting for confirmation...")
        last_round += 1
        client.status_after_block(last_round)
        txinfo = client.pending_transaction_info(txid)
    print(f"Transaction confirmed in round {txinfo.get('confirmed-round')}")
    return txinfo

def deploy_app(client, creator_address, approval_program, clear_program, global_schema, local_schema):
    # Get suggested parameters
    params = client.suggested_params()

    # Create unsigned transaction
    txn = transaction.ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema
    )

    # Sign transaction
    signed_txn = txn.sign(private_key)
    tx_id = signed_txn.transaction.get_txid()

    # Submit transaction
    client.send_transactions([signed_txn])
    print(f"Sent application create transaction with ID: {tx_id}")

    # Wait for confirmation
    tx_response = wait_for_confirmation(client, tx_id)  
    app_id = tx_response["application-index"]
    print(f"Created application with ID: {app_id}")
    return app_id

# Main deployment function
def main():
    # Read and compile approval and clear programs
    with open("proof_of_action_approval.teal", "r") as f:
        approval_source = f.read()
    with open("proof_of_action_clear.teal", "r") as f:
        clear_source = f.read()

    approval_program = compile_program(algod_client, approval_source)
    clear_program = compile_program(algod_client, clear_source)

    # Define schemas for the proof-of-action contract
    global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=1)
    local_schema = transaction.StateSchema(num_uints=1, num_byte_slices=50)

    # Deploy the proof-of-action app
    print("Deploying Proof-of-Action contract...")
    proof_app_id = deploy_app(
        algod_client,
        address,
        approval_program,
        clear_program,
        global_schema,
        local_schema
    )
    
    # Read and compile NFT minting approval and clear programs
    with open("nft_minting_approval.teal", "r") as f:
        approval_source = f.read()
    with open("nft_minting_clear.teal", "r") as f:
        clear_source = f.read()

    approval_program = compile_program(algod_client, approval_source)
    clear_program = compile_program(algod_client, clear_source)

    # Define schemas for the NFT minting contract
    global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=2)
    local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    # Deploy the NFT minting app
    print("Deploying NFT Minting contract...")
    nft_app_id = deploy_app(
        algod_client,
        address,
        approval_program,
        clear_program,
        global_schema,
        local_schema
    )
    
    # Read and compile marketplace approval and clear programs
    with open("marketplace_approval.teal", "r") as f:
        approval_source = f.read()
    with open("marketplace_clear.teal", "r") as f:
        clear_source = f.read()

    approval_program = compile_program(algod_client, approval_source)
    clear_program = compile_program(algod_client, clear_source)

    # Define schemas for the marketplace contract
    global_schema = transaction.StateSchema(num_uints=3, num_byte_slices=2)
    local_schema = transaction.StateSchema(num_uints=1, num_byte_slices=50)

    # Deploy the marketplace app
    print("Deploying NFT Marketplace contract...")
    marketplace_app_id = deploy_app(
        algod_client,
        address,
        approval_program,
        clear_program,
        global_schema,
        local_schema
    )
    
    # Save app IDs to a config file
    with open("contract_config.json", "w") as f:
        import json
        config = {
            "proof_app_id": proof_app_id,
            "nft_app_id": nft_app_id,
            "marketplace_app_id": marketplace_app_id,
            "network": "testnet",
            "creator_address": address
        }
        json.dump(config, f, indent=2)
    
    print("\nDeployment completed! App IDs saved to contract_config.json")
    print(f"Proof-of-Action App ID: {proof_app_id}")
    print(f"NFT Minting App ID: {nft_app_id}")
    print(f"Marketplace App ID: {marketplace_app_id}")

if __name__ == "__main__":
    main()
```

#### 3. Compile the PyTeal Contracts

```bash
# Compile PyTeal to TEAL
python proof_of_action.py
python nft_minting.py
python marketplace.py
```

This will generate the TEAL files needed for deployment.

#### 4. Install Required Packages

```bash
pip install py-algorand-sdk pyteal python-dotenv
```

#### 5. Deploy to TestNet

```bash
python deploy_contracts.py
```

This script will:
1. Connect to Algorand TestNet using your TrustLoop wallet credentials
2. Compile and deploy all three contracts
3. Save the contract app IDs to `contract_config.json`
4. Display the deployment results with app IDs

#### 6. Update Frontend Environment Variables

Add the deployed app IDs to your frontend .env file:

```
REACT_APP_PROOF_APP_ID=<your_proof_app_id>
REACT_APP_NFT_APP_ID=<your_nft_app_id>
REACT_APP_MARKETPLACE_APP_ID=<your_marketplace_app_id>
```

## Sample Transactions

### 1. Record a Task Completion

```python
from algosdk import account, transaction
from algosdk.v2client import algod

# Initialize algod client
algod_address = "http://localhost:4001"
algod_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
algod_client = algod.AlgodClient(algod_token, algod_address)

# Account details
private_key = "your-private-key"
sender = account.address_from_private_key(private_key)

# Proof-of-Action app ID (replace with your deployed app ID)
app_id = 12345

# Task details
task_id = "task-123"
timestamp = str(int(time.time()))

# Create application call transaction
sp = algod_client.suggested_params()
app_args = [
    "record_proof",
    task_id,
    timestamp
]

txn = transaction.ApplicationCallTxn(
    sender=sender,
    sp=sp,
    index=app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=app_args
)

# Sign and submit transaction
signed_txn = txn.sign(private_key)
tx_id = algod_client.send_transaction(signed_txn)
result = transaction.wait_for_confirmation(algod_client, tx_id, 4)
print(f"Task completion recorded! Transaction ID: {tx_id}")
```

### 2. Mint an NFT Reward

```python
# NFT Minting app ID (replace with your deployed app ID)
nft_app_id = 67890
proof_app_id = 12345

# Task details
task_id = "task-123"
task_title = "Complete first login"
rarity = "uncommon"
metadata_ipfs = "Qm..."  # IPFS hash of metadata JSON

# Create verification transaction
verify_txn = transaction.ApplicationCallTxn(
    sender=sender,
    sp=sp,
    index=proof_app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=["verify_proof", task_id]
)

# Create mint transaction
mint_txn = transaction.ApplicationCallTxn(
    sender=sender,
    sp=sp,
    index=nft_app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=["mint_nft", task_id, task_title, rarity, metadata_ipfs]
)

# Group transactions
gid = transaction.calculate_group_id([mint_txn, verify_txn])
mint_txn.group = gid
verify_txn.group = gid

# Sign and submit transactions
signed_mint_txn = mint_txn.sign(private_key)
signed_verify_txn = verify_txn.sign(private_key)

tx_id = algod_client.send_transactions([signed_mint_txn, signed_verify_txn])
result = transaction.wait_for_confirmation(algod_client, tx_id, 4)
print(f"NFT minted! Transaction ID: {tx_id}")
```

### 3. List an NFT for Sale

```python
# Marketplace app ID (replace with your deployed app ID)
marketplace_app_id = 54321

# NFT asset ID (from the minted NFT)
asset_id = 123456
price = 1000000  # 1 ALGO in microALGO

# Prepare contract opt-in to NFT (required once per asset)
asset_optin_txn = transaction.AssetTransferTxn(
    sender=sender,
    sp=sp,
    receiver=marketplace_app_address,  # Contract's address
    amt=0,
    index=asset_id
)

# Create listing transaction
list_txn = transaction.ApplicationCallTxn(
    sender=sender,
    sp=sp,
    index=marketplace_app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=["list_nft", str(asset_id), str(price)]
)

# Group transactions
gid = transaction.calculate_group_id([list_txn, asset_optin_txn])
list_txn.group = gid
asset_optin_txn.group = gid

# Sign and submit transactions
signed_list_txn = list_txn.sign(private_key)
signed_asset_optin_txn = asset_optin_txn.sign(private_key)

tx_id = algod_client.send_transactions([signed_list_txn, signed_asset_optin_txn])
result = transaction.wait_for_confirmation(algod_client, tx_id, 4)
print(f"NFT listed for sale! Transaction ID: {tx_id}")
```

### 4. Buy a Listed NFT

```python
# NFT details
asset_id = 123456
seller_address = "SELLER_ALGORAND_ADDRESS"
price = 1000000  # 1 ALGO in microALGO

# Create payment transaction
payment_txn = transaction.PaymentTxn(
    sender=sender,
    sp=sp,
    receiver=marketplace_app_address,  # Contract's address
    amt=price
)

# Create buy transaction
buy_txn = transaction.ApplicationCallTxn(
    sender=sender,
    sp=sp,
    index=marketplace_app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=["buy_nft", str(asset_id)],
    accounts=[seller_address]  # Include seller's address
)

# Group transactions
gid = transaction.calculate_group_id([buy_txn, payment_txn])
buy_txn.group = gid
payment_txn.group = gid

# Sign and submit transactions
signed_buy_txn = buy_txn.sign(private_key)
signed_payment_txn = payment_txn.sign(private_key)

tx_id = algod_client.send_transactions([signed_buy_txn, signed_payment_txn])
result = transaction.wait_for_confirmation(algod_client, tx_id, 4)
print(f"NFT purchased! Transaction ID: {tx_id}")
```

## Integration with TrustLoop Frontend

### 1. Update Your React Application

Install the required packages in your React project:

```bash
npm install algosdk @randlabs/myalgo-connect @perawallet/connect
```

### 2. Create a Smart Contract Integration Service

Create a file `src/services/algorand.ts` to manage contract interactions:

```typescript
import algosdk from 'algosdk';

// Get app IDs from environment variables
const PROOF_APP_ID = parseInt(process.env.REACT_APP_PROOF_APP_ID || '0');
const NFT_APP_ID = parseInt(process.env.REACT_APP_NFT_APP_ID || '0');
const MARKETPLACE_APP_ID = parseInt(process.env.REACT_APP_MARKETPLACE_APP_ID || '0');

// Initialize Algorand client for TestNet
const algodClient = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  ''
);

const indexerClient = new algosdk.Indexer(
  '',
  'https://testnet-idx.algonode.cloud',
  ''
);

// Record a task completion
export async function recordTaskCompletion(walletAddress: string, taskId: string) {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create application call transaction
    const appCallTxn = algosdk.makeApplicationNoOpTxn(
      walletAddress,
      suggestedParams,
      PROOF_APP_ID,
      [new TextEncoder().encode('record_proof'), new TextEncoder().encode(taskId), algosdk.encodeUint64(Date.now())]
    );
    
    // Return the transaction for signing in your component
    return appCallTxn;
  } catch (error) {
    console.error('Error creating task completion transaction:', error);
    throw error;
  }
}

// Check if a task is completed
export async function isTaskCompleted(walletAddress: string, taskId: string) {
  try {
    // Get account information including app local state
    const accountInfo = await algodClient.accountInformation(walletAddress).do();
    
    // Find our app in the account's local state
    const appLocalState = accountInfo['apps-local-state'].find(
      (app) => app.id === PROOF_APP_ID
    );
    
    if (!appLocalState || !appLocalState['key-value']) {
      return false;
    }
    
    // Check if the task is in the local state
    const taskKey = `task_${taskId}`;
    const encodedKey = new TextEncoder().encode(taskKey);
    const base64Key = Buffer.from(encodedKey).toString('base64');
    
    const taskCompletion = appLocalState['key-value'].find(
      (kv) => kv.key === base64Key
    );
    
    return !!taskCompletion;
  } catch (error) {
    console.error('Error checking task completion:', error);
    return false;
  }
}

// Mint NFT function
export async function mintNFT(walletAddress: string, taskId: string, taskTitle: string, rarity: string, metadataIpfs: string) {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create verify proof transaction
    const verifyTxn = algosdk.makeApplicationNoOpTxn(
      walletAddress,
      suggestedParams,
      PROOF_APP_ID,
      [new TextEncoder().encode('verify_proof'), new TextEncoder().encode(taskId)]
    );
    
    // Create mint NFT transaction
    const mintTxn = algosdk.makeApplicationNoOpTxn(
      walletAddress,
      suggestedParams,
      NFT_APP_ID,
      [
        new TextEncoder().encode('mint_nft'),
        new TextEncoder().encode(taskId),
        new TextEncoder().encode(taskTitle),
        new TextEncoder().encode(rarity),
        new TextEncoder().encode(metadataIpfs)
      ]
    );
    
    // Group transactions
    const txnGroup = algosdk.assignGroupID([mintTxn, verifyTxn]);
    
    // Return the transactions for signing in your component
    return txnGroup;
  } catch (error) {
    console.error('Error creating mint NFT transaction:', error);
    throw error;
  }
}

// Get all NFTs owned by an address
export async function getUserNFTs(walletAddress: string) {
  try {
    const assets = await indexerClient.lookupAccountAssets(walletAddress).do();
    return assets['assets'].filter(asset => asset.amount > 0);
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    return [];
  }
}

// List an NFT on the marketplace
export async function listNFTForSale(walletAddress: string, assetId: number, price: number) {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Asset opt-in transaction for the contract
    const contractAddress = algosdk.getApplicationAddress(MARKETPLACE_APP_ID);
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      walletAddress,
      contractAddress,
      undefined,
      undefined,
      0,
      undefined,
      assetId,
      suggestedParams
    );
    
    // List NFT transaction
    const listTxn = algosdk.makeApplicationNoOpTxn(
      walletAddress,
      suggestedParams,
      MARKETPLACE_APP_ID,
      [
        new TextEncoder().encode('list_nft'),
        algosdk.encodeUint64(assetId),
        algosdk.encodeUint64(price)
      ]
    );
    
    // Group transactions
    const txnGroup = algosdk.assignGroupID([listTxn, optInTxn]);
    
    // Return the transactions for signing in your component
    return txnGroup;
  } catch (error) {
    console.error('Error creating list NFT transaction:', error);
    throw error;
  }
}

export default {
  recordTaskCompletion,
  isTaskCompleted,
  mintNFT,
  getUserNFTs,
  listNFTForSale,
  PROOF_APP_ID,
  NFT_APP_ID,
  MARKETPLACE_APP_ID
};
```

### 3. Update the Rewards Page to Use Algorand State

Modify your Rewards page to check both Supabase and Algorand for task completions:

```typescript
// In src/pages/Rewards.tsx

import { isTaskCompleted, recordTaskCompletion } from '../services/algorand';

// Inside your component
const [onchainCompletions, setOnchainCompletions] = useState<Record<string, boolean>>({});

// Add to your useEffect
useEffect(() => {
  if (isConnected && address) {
    // Load on-chain completion status for each task
    const loadOnchainStatus = async () => {
      const statuses: Record<string, boolean> = {};
      
      for (const task of tasks) {
        statuses[task.id] = await isTaskCompleted(address, task.id);
      }
      
      setOnchainCompletions(statuses);
    };
    
    loadOnchainStatus();
  }
}, [isConnected, address, tasks]);

// Then in your task rendering, use both Supabase and on-chain data
// A task is fully completed if it exists in both systems
const isFullyCompleted = (task) => {
  return task.isCompleted && onchainCompletions[task.id];
};
```

### 4. Add NFT Display in the Rewards Page

```typescript
// In your Rewards component
const [userNFTs, setUserNFTs] = useState([]);

useEffect(() => {
  if (isConnected && address) {
    // Load user's NFTs
    const loadUserNFTs = async () => {
      const nfts = await getUserNFTs(address);
      setUserNFTs(nfts);
    };
    
    loadUserNFTs();
  }
}, [isConnected, address]);

// Then render NFTs in your component
const renderUserNFTs = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {userNFTs.map(nft => (
        <div key={nft.asset-id} className="border rounded-lg p-4">
          <h3 className="font-bold">{nft.params.name}</h3>
          <img 
            src={nft.params.url.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
            alt={nft.params.name}
            className="w-full h-auto mt-2 rounded"
          />
        </div>
      ))}
    </div>
  );
};
```

## Troubleshooting TestNet Deployment

### Common Issues and Solutions

#### 1. Transaction Failed - Insufficient Funds

**Solution**: Fund your TrustLoop wallet with TestNet ALGO from the [Algorand TestNet Dispenser](https://bank.testnet.algorand.network/)

#### 2. "Cannot find name 'wait_for_confirmation'"

**Solution**: Make sure you're using the latest Algorand SDK (v2) and that the function is properly defined in your deployment script.

#### 3. PyTeal Version Compatibility

**Solution**: Ensure you're using a compatible version of PyTeal. These contracts were developed with PyTeal v0.20.1.

```bash
pip install pyteal==0.20.1
```

#### 4. Contract Address Funding

After deployment, the contract addresses need minimum balance requirements for asset operations:

```python
# Get contract address
contract_address = algosdk.logic.get_application_address(app_id)

# Fund the contract with 1 ALGO
params = algod_client.suggested_params()
txn = algosdk.PaymentTxn(
    sender=address,
    sp=params,
    receiver=contract_address,
    amt=1000000  # 1 ALGO in microALGO
)

signed_txn = txn.sign(private_key)
algod_client.send_transaction(signed_txn)
wait_for_confirmation(algod_client, signed_txn.get_txid())
```

#### 5. Adding Assets to Frontend Indexing

To see your NFTs in the frontend immediately, you can bypass the indexer delay by directly tracking your asset IDs in local storage and adding them to the user interface.

### Preparing for MainNet

Before deploying to MainNet:

1. Conduct thorough security audits of all contracts
2. Test every transaction path on TestNet
3. Calculate minimum balance requirements precisely
4. Set up a dedicated creator wallet for royalties
5. Consider using a multisig wallet for admin functions
6. Document all app IDs and transaction flows

## Security Considerations

- The contracts implement ownership verification to prevent unauthorized NFT listings
- Royalty payments are enforced at the contract level
- Task verification prevents duplicate minting
- Admin controls are protected by sender validation
