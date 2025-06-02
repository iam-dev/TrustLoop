#!/usr/bin/env python3
"""
Connect deployed TrustLoop smart contracts and save configuration.
This script connects the already deployed NFT minting contract to the Proof-of-Action contract.
"""
import os
import json
import time
from dotenv import load_dotenv
from algosdk import account, transaction, encoding, mnemonic
from algosdk.v2client import algod

# Load environment variables
load_dotenv()

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

def main():
    """Connect deployed contracts and save configuration"""
    
    # Contract IDs from previous deployment
    proof_app_id = 740510673
    nft_app_id = 740510684
    marketplace_app_id = 740510687
    
    # Connect to Algorand TestNet node
    algod_token = os.getenv("ALGOD_TOKEN", "")
    algod_address = os.getenv("ALGOD_SERVER", "https://testnet-api.algonode.cloud")
    algod_client = algod.AlgodClient(algod_token, algod_address)
    
    # Get account information from environment
    try:
        # Private key should be securely stored and not hard-coded
        passphrase = os.getenv("MNEMONIC")
        if not passphrase:
            raise ValueError("MNEMONIC environment variable is not set")
        
        private_key = mnemonic.to_private_key(passphrase)
        address = account.address_from_private_key(private_key)
        print(f"Using address: {address}")
        
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
        script_dir = os.path.dirname(os.path.abspath(__file__))
        contracts_dir = os.path.dirname(script_dir)
        
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
        print("Contract connection completed successfully!")
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
        print(f"Error during connection: {e}")
        raise

if __name__ == "__main__":
    main()
