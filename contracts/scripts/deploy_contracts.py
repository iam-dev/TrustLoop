"""
TrustLoop Smart Contract Deployment Script

This script deploys all TrustLoop smart contracts to Algorand TestNet using the wallet
credentials specified in .env file.

Requirements:
- Python 3.10+
- py-algorand-sdk
- pyteal
- python-dotenv
"""

import os
import base64
import json
import time
from algosdk import account, encoding, mnemonic, transaction
from algosdk.v2client import algod, indexer
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
algod_address = os.getenv("ALGOD_SERVER", "https://testnet-api.algonode.cloud")
algod_token = os.getenv("ALGOD_TOKEN", "")
headers = {"X-API-Key": algod_token} if algod_token else None
algod_client = algod.AlgodClient(algod_token, algod_address, headers)

def compile_program(client, source_code):
    """Compile TEAL source code to binary"""
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response["result"])

def wait_for_confirmation(client, txid):
    """Wait until the transaction is confirmed or rejected, or until timeout"""
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
    """Deploy a smart contract to Algorand"""
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

def fund_contract(client, app_id, amount=1000000):
    """Fund the contract with ALGO for minimum balance requirements"""
    # Get the contract address
    contract_address = transaction.logic.get_application_address(app_id)
    print(f"Funding contract address {contract_address} with {amount/1000000} ALGO")
    
    # Get suggested parameters
    params = client.suggested_params()
    
    # Create payment transaction
    txn = transaction.PaymentTxn(
        sender=address,
        sp=params,
        receiver=contract_address,
        amt=amount
    )
    
    # Sign and submit transaction
    signed_txn = txn.sign(private_key)
    tx_id = client.send_transactions([signed_txn])
    
    # Wait for confirmation
    wait_for_confirmation(client, signed_txn.get_txid())
    print(f"Funded contract with {amount/1000000} ALGO")

def main():
    """Main deployment function"""
    print("Starting TrustLoop contract deployment to TestNet...")
    
    # Get the absolute path to the contracts directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    contracts_dir = os.path.dirname(script_dir)
    src_dir = os.path.join(contracts_dir, "src")
    
    # Define paths for TEAL output files
    build_dir = os.path.join(contracts_dir, "build")
    teal_files = {
        "proof_of_action": {
            "approval": os.path.join(build_dir, "proof_of_action_approval.teal"),
            "clear": os.path.join(build_dir, "proof_of_action_clear.teal"),
            "source": os.path.join(src_dir, "proof_of_action.py")
        },
        "nft_minting": {
            "approval": os.path.join(build_dir, "nft_minting_approval.teal"),
            "clear": os.path.join(build_dir, "nft_minting_clear.teal"),
            "source": os.path.join(src_dir, "nft_minting.py")
        },
        "marketplace": {
            "approval": os.path.join(build_dir, "marketplace_approval.teal"),
            "clear": os.path.join(build_dir, "marketplace_clear.teal"),
            "source": os.path.join(src_dir, "marketplace.py")
        }
    }
    
    # Ensure TEAL files exist by compiling the PyTeal if needed
    need_compilation = False
    for contract in teal_files.values():
        if not (os.path.exists(contract["approval"]) and os.path.exists(contract["clear"])):
            need_compilation = True
            break
    
    if need_compilation:
        print("Compiling PyTeal to TEAL...")
        os.chdir(contracts_dir)
        for contract_name, paths in teal_files.items():
            print(f"Compiling {contract_name}...")
            os.system(f"python3 {paths['source']}")
        print("Compilation complete.")
    
    # Change to the contracts directory for the rest of the deployment
    os.chdir(contracts_dir)
    
    try:
        # Read and compile approval and clear programs for Proof-of-Action
        print("\n1. Deploying Proof-of-Action contract...")
        with open(teal_files["proof_of_action"]["approval"], "r") as f:
            approval_source = f.read()
        with open(teal_files["proof_of_action"]["clear"], "r") as f:
            clear_source = f.read()

        approval_program = compile_program(algod_client, approval_source)
        clear_program = compile_program(algod_client, clear_source)

        # Define schemas for the proof-of-action contract
        global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=1)
        local_schema = transaction.StateSchema(num_uints=2, num_byte_slices=14)

        # Deploy the proof-of-action app
        proof_app_id = deploy_app(
            algod_client,
            address,
            approval_program,
            clear_program,
            global_schema,
            local_schema
        )
        
        # Fund the contract
        fund_contract(algod_client, proof_app_id)
        
        # Read and compile NFT minting approval and clear programs
        print("\n2. Deploying NFT Minting contract...")
        with open(teal_files["nft_minting"]["approval"], "r") as f:
            approval_source = f.read()
        with open(teal_files["nft_minting"]["clear"], "r") as f:
            clear_source = f.read()

        approval_program = compile_program(algod_client, approval_source)
        clear_program = compile_program(algod_client, clear_source)

        # Define schemas for the NFT minting contract
        global_schema = transaction.StateSchema(num_uints=2, num_byte_slices=2)
        local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)

        # Deploy the NFT minting app
        nft_app_id = deploy_app(
            algod_client,
            address,
            approval_program,
            clear_program,
            global_schema,
            local_schema
        )
        
        # Fund the contract
        fund_contract(algod_client, nft_app_id)
        
        # Read and compile marketplace approval and clear programs
        print("\n3. Deploying NFT Marketplace contract...")
        with open(teal_files["marketplace"]["approval"], "r") as f:
            approval_source = f.read()
        with open(teal_files["marketplace"]["clear"], "r") as f:
            clear_source = f.read()

        approval_program = compile_program(algod_client, approval_source)
        clear_program = compile_program(algod_client, clear_source)

        # Define schemas for the marketplace contract
        global_schema = transaction.StateSchema(num_uints=3, num_byte_slices=2)
        local_schema = transaction.StateSchema(num_uints=4, num_byte_slices=12)

        # Deploy the marketplace app
        marketplace_app_id = deploy_app(
            algod_client,
            address,
            approval_program,
            clear_program,
            global_schema,
            local_schema
        )
        
        # Fund the contract
        fund_contract(algod_client, marketplace_app_id, 2000000)  # 2 ALGO for marketplace
        
        # Connect NFT minting to proof app
        print("\n4. Connecting NFT minting contract to Proof-of-Action contract...")
        params = algod_client.suggested_params()
        app_args = [
            "set_proof_app".encode(),
            proof_app_id.to_bytes(8, 'big')
        ]
        
        txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=nft_app_id,
            app_args=app_args
        )
        
        signed_txn = txn.sign(private_key)
        algod_client.send_transactions([signed_txn])
        wait_for_confirmation(algod_client, signed_txn.get_txid())
        
        # Save app IDs to a config file
        print("\n5. Saving configuration...")
        config = {
            "proof_app_id": proof_app_id,
            "nft_app_id": nft_app_id,
            "marketplace_app_id": marketplace_app_id,
            "network": "testnet",
            "creator_address": address,
            "deployment_timestamp": int(time.time()),
            "deployment_date": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        }
        
        config_path = os.path.join(contracts_dir, "contract_config.json")
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)
        
        print("\n==========================================")
        print("Deployment completed successfully!")
        print("==========================================")
        print(f"Proof-of-Action App ID: {proof_app_id}")
        print(f"NFT Minting App ID: {nft_app_id}")
        print(f"Marketplace App ID: {marketplace_app_id}")
        print("==========================================")
        print("Configuration saved to contract_config.json")
        print("Add these values to your frontend .env file:")
        print(f"REACT_APP_PROOF_APP_ID={proof_app_id}")
        print(f"REACT_APP_NFT_APP_ID={nft_app_id}")
        print(f"REACT_APP_MARKETPLACE_APP_ID={marketplace_app_id}")
        print("==========================================")
        
    except Exception as e:
        print(f"Error during deployment: {e}")
        raise

if __name__ == "__main__":
    main()
