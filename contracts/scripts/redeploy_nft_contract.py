#!/usr/bin/env python3
"""
Redeploy the NFT minting contract with the correct schema (2 integers instead of 1)
and connect it to the Proof-of-Action contract.
"""
import os
import json
import time
import base64
from dotenv import load_dotenv
from algosdk import account, transaction, encoding, mnemonic
from algosdk.v2client import algod
from algosdk.logic import get_application_address

# Load environment variables
load_dotenv()

def compile_program(client, source_code):
    """Compile TEAL source code to binary"""
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])

def wait_for_confirmation(client, txid):
    """Wait until the transaction is confirmed or rejected, or until timeout"""
    last_round = client.status().get('last-round')
    txinfo = client.pending_transaction_info(txid)
    while not (txinfo.get('confirmed-round') and txinfo.get('confirmed-round') > 0):
        print("Waiting for confirmation...")
        last_round += 1
        client.status_after_block(last_round)
        txinfo = client.pending_transaction_info(txid)
    print(f"Transaction confirmed in round {txinfo.get('confirmed-round')}")
    return txinfo

def deploy_app(client, creator_address, approval_program, clear_program, global_schema, local_schema):
    """Deploy a smart contract to Algorand"""
    params = client.suggested_params()
    
    # Create the application creation transaction
    txn = transaction.ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=None
    )
    
    # Get the private key from environment
    private_key = mnemonic.to_private_key(os.getenv("MNEMONIC"))
    
    # Sign the transaction
    signed_txn = txn.sign(private_key)
    
    # Send the transaction to the network
    tx_id = client.send_transaction(signed_txn)
    print(f"Sent application create transaction with ID: {tx_id}")
    
    # Wait for confirmation
    wait_for_confirmation(client, tx_id)
    
    # Get the new application ID
    transaction_response = client.pending_transaction_info(tx_id)
    app_id = transaction_response['application-index']
    print(f"Created application with ID: {app_id}")
    
    return app_id

def fund_contract(client, app_id, amount=1000000):
    """Fund the contract with ALGO for minimum balance requirements"""
    params = client.suggested_params()
    
    # Get the application address
    app_address = get_application_address(app_id)
    
    # Create the payment transaction
    txn = transaction.PaymentTxn(
        sender=account.address_from_private_key(mnemonic.to_private_key(os.getenv("MNEMONIC"))),
        sp=params,
        receiver=app_address,
        amt=amount
    )
    
    # Sign the transaction
    signed_txn = txn.sign(mnemonic.to_private_key(os.getenv("MNEMONIC")))
    
    # Send the transaction to the network
    tx_id = client.send_transaction(signed_txn)
    print(f"Funding contract address {app_address} with {amount/1000000} ALGO")
    
    # Wait for confirmation
    wait_for_confirmation(client, tx_id)
    print(f"Funded contract with {amount/1000000} ALGO")

def main():
    """Main function to redeploy the NFT minting contract"""
    # Contract IDs from previous deployment
    proof_app_id = 740510673
    old_nft_app_id = 740510684
    marketplace_app_id = 740510687
    
    # Get absolute paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    contracts_dir = os.path.dirname(script_dir)
    build_dir = os.path.join(contracts_dir, "build")
    src_dir = os.path.join(contracts_dir, "src")
    
    # Connect to Algorand TestNet node
    algod_token = os.getenv("ALGOD_TOKEN", "")
    algod_address = os.getenv("ALGOD_SERVER", "https://testnet-api.algonode.cloud")
    algod_client = algod.AlgodClient(algod_token, algod_address)
    
    # Get account information from environment
    try:
        # Get the mnemonic from environment
        passphrase = os.getenv("MNEMONIC")
        if not passphrase:
            raise ValueError("MNEMONIC environment variable is not set")
        
        private_key = mnemonic.to_private_key(passphrase)
        address = account.address_from_private_key(private_key)
        print(f"Using address: {address}")
        
        print("\nRedeploying NFT Minting contract with correct schema...")
        
        # Read and compile NFT minting approval and clear programs
        nft_approval_path = os.path.join(build_dir, "nft_minting_approval.teal")
        nft_clear_path = os.path.join(build_dir, "nft_minting_clear.teal")
        
        with open(nft_approval_path, "r") as f:
            approval_source = f.read()
        with open(nft_clear_path, "r") as f:
            clear_source = f.read()
        
        # Compile the programs
        approval_program = compile_program(algod_client, approval_source)
        clear_program = compile_program(algod_client, clear_source)
        
        # Define schemas for the NFT minting contract - INCREASED to 2 integers
        global_schema = transaction.StateSchema(num_uints=2, num_byte_slices=2)
        local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)
        
        # No need to create a logic module - already imported at the top
        
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
        
        # Connect NFT minting to proof app
        print("\nConnecting NFT minting contract to Proof-of-Action contract...")
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
        print("\nSaving configuration...")
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
        print("NFT contract redeployment completed successfully!")
        print("==========================================")
        print(f"Old NFT Minting App ID: {old_nft_app_id} (obsolete)")
        print(f"New NFT Minting App ID: {nft_app_id}")
        print(f"Proof-of-Action App ID: {proof_app_id}")
        print(f"Marketplace App ID: {marketplace_app_id}")
        print("==========================================")
        print("Configuration saved to contract_config.json")
        print("Add these values to your frontend .env file:")
        print(f"REACT_APP_PROOF_APP_ID={proof_app_id}")
        print(f"REACT_APP_NFT_APP_ID={nft_app_id}")
        print(f"REACT_APP_MARKETPLACE_APP_ID={marketplace_app_id}")
        print("==========================================")
        
    except Exception as e:
        print(f"Error during redeployment: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
