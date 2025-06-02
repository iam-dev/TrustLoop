import base64
import os
from typing import List, Tuple, Dict, Any, Optional
import unittest
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# Constants for testing with local node
ALGOD_ADDRESS = "http://localhost:4001"
ALGOD_TOKEN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
INDEXER_ADDRESS = "http://localhost:8980"
INDEXER_TOKEN = ""

class AlgorandTestCase(unittest.TestCase):
    """Base test case class for Algorand smart contract tests"""
    
    @classmethod
    def setUpClass(cls):
        """Set up Algorand client and test accounts"""
        cls.algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # For testing purposes, we'll create local test accounts
        # This approach is better for unit tests as we have access to the private keys
        cls.creator_private_key, cls.creator_address = account.generate_account()
        cls.user_private_key, cls.user_address = account.generate_account()
        cls.admin_private_key, cls.admin_address = account.generate_account()
        
        # In a real sandbox environment, you would use the sandbox's pre-funded accounts
        # The sandbox has these accounts available for use:
        # Online account: RTXKUUW7XHQKRV7PFZ6HMSZOMMC4VF2J7MLBRENEDUUUDORZVJ5OKISRSI
        # Offline account 1: 3BISTOD3LQAKRPBXKDHJA4JZRXMWK7LC7VK3C7KWQTXS632PKWIB2LQSHQ
        # Offline account 2: HFSJ5Z3AZQMHVJQNIPNMXNE26WON7NK4L6CI5MRRWOLTLPIMLYNPBEU5AM
        
        # For unit testing, we'll skip using real accounts and instead mock
        # the necessary behaviors to verify contract logic
        
        # Store mnemonics for reference if needed
        cls.creator_mnemonic = mnemonic.from_private_key(cls.creator_private_key)
        cls.user_mnemonic = mnemonic.from_private_key(cls.user_private_key)
        cls.admin_mnemonic = mnemonic.from_private_key(cls.admin_private_key)
        
        # Attempt to fund these accounts from the Sandbox
        cls.fund_test_accounts()
    
    @classmethod
    def _check_account_balance(cls, address: str, min_amount: int = 1000000):
        """Check if an account has sufficient balance for testing"""
        try:
            account_info = cls.algod_client.account_info(address)
            balance = account_info.get("amount", 0)
            if balance < min_amount:
                print(f"Warning: Account {address} has low balance: {balance} microAlgos")
                print(f"Attempting to fund this account from Sandbox...")
                return False
            else:
                print(f"Account {address} has sufficient balance: {balance} microAlgos")
                return True
        except Exception as e:
            # If the account doesn't exist yet, we'll fund it
            if "not found" in str(e).lower():
                print(f"Account {address} not found - will need funding")
                return False
            else:
                print(f"Error checking account balance for {address}: {e}")
                print(f"Make sure the Algorand Sandbox is running properly")
                return False
    
    @classmethod
    def fund_test_accounts(cls):
        """Fund test accounts from the Sandbox's funded account"""
        # The main funded account in Sandbox
        sandbox_account = "RTXKUUW7XHQKRV7PFZ6HMSZOMMC4VF2J7MLBRENEDUUUDORZVJ5OKISRSI"
        
        # Check if our test accounts need funding
        accounts_to_fund = []
        for acc_address in [cls.creator_address, cls.user_address, cls.admin_address]:
            if not cls._check_account_balance(acc_address, 10000000):
                accounts_to_fund.append(acc_address)
        
        if not accounts_to_fund:
            print("All test accounts are already funded")
            return
            
        print(f"Need to fund {len(accounts_to_fund)} accounts from sandbox")
        print("Note: Since we don't have direct access to the Sandbox's account private keys,")
        print("you'll need to manually fund these accounts using the sandbox CLI:")
        
        for address in accounts_to_fund:
            print(f"\n./sandbox goal clerk send -a 10000000 -f {sandbox_account} -t {address}")
        
        print("\nAfter funding, restart the tests to continue.")
        print("Alternative: Use the generated accounts only for unit testing without Sandbox integration.")
    
    def wait_for_confirmation(self, txid: str) -> Dict[str, Any]:
        """Wait for a transaction to be confirmed"""
        try:
            confirmed_txn = transaction.wait_for_confirmation(self.algod_client, txid, 4)
            return confirmed_txn
        except Exception as e:
            self.fail(f"Transaction failed to confirm: {e}")
    
    def create_app(self, creator_private_key: str, approval_program: bytes, 
                  clear_program: bytes, global_schema: transaction.StateSchema,
                  local_schema: transaction.StateSchema) -> int:
        """Create a new application"""
        params = self.algod_client.suggested_params()
        
        txn = transaction.ApplicationCreateTxn(
            sender=account.address_from_private_key(creator_private_key),
            sp=params,
            on_complete=transaction.OnComplete.NoOpOC,
            approval_program=approval_program,
            clear_program=clear_program,
            global_schema=global_schema,
            local_schema=local_schema
        )
        
        signed_txn = txn.sign(creator_private_key)
        txid = self.algod_client.send_transaction(signed_txn)
        
        confirmed_txn = self.wait_for_confirmation(txid)
        app_id = confirmed_txn["application-index"]
        return app_id
    
    def call_app(self, app_id: int, sender_private_key: str, app_args: List[bytes] = None,
                accounts: List[str] = None, foreign_apps: List[int] = None,
                foreign_assets: List[int] = None) -> Dict[str, Any]:
        """Call an application"""
        sender = account.address_from_private_key(sender_private_key)
        params = self.algod_client.suggested_params()
        
        txn = transaction.ApplicationNoOpTxn(
            sender=sender,
            sp=params,
            index=app_id,
            app_args=app_args or [],
            accounts=accounts or [],
            foreign_apps=foreign_apps or [],
            foreign_assets=foreign_assets or []
        )
        
        signed_txn = txn.sign(sender_private_key)
        txid = self.algod_client.send_transaction(signed_txn)
        
        return self.wait_for_confirmation(txid)
    
    def opt_in_app(self, app_id: int, sender_private_key: str) -> Dict[str, Any]:
        """Opt in to an application"""
        sender = account.address_from_private_key(sender_private_key)
        params = self.algod_client.suggested_params()
        
        txn = transaction.ApplicationOptInTxn(
            sender=sender,
            sp=params,
            index=app_id
        )
        
        signed_txn = txn.sign(sender_private_key)
        txid = self.algod_client.send_transaction(signed_txn)
        
        return self.wait_for_confirmation(txid)
    
    def create_asset(self, creator_private_key: str, asset_name: str, unit_name: str, 
                   total: int, decimals: int, default_frozen: bool = False,
                   url: str = "", metadata_hash: bytes = None) -> int:
        """Create a new asset"""
        params = self.algod_client.suggested_params()
        sender = account.address_from_private_key(creator_private_key)
        
        txn = transaction.AssetConfigTxn(
            sender=sender,
            sp=params,
            total=total,
            default_frozen=default_frozen,
            unit_name=unit_name,
            asset_name=asset_name,
            manager=sender,
            reserve=sender,
            freeze=sender,
            clawback=sender,
            url=url,
            metadata_hash=metadata_hash,
            decimals=decimals
        )
        
        signed_txn = txn.sign(creator_private_key)
        txid = self.algod_client.send_transaction(signed_txn)
        
        confirmed_txn = self.wait_for_confirmation(txid)
        asset_id = confirmed_txn["asset-index"]
        return asset_id
    
    def opt_in_asset(self, asset_id: int, sender_private_key: str) -> Dict[str, Any]:
        """Opt in to an asset"""
        sender = account.address_from_private_key(sender_private_key)
        params = self.algod_client.suggested_params()
        
        txn = transaction.AssetTransferTxn(
            sender=sender,
            sp=params,
            receiver=sender,
            amt=0,
            index=asset_id
        )
        
        signed_txn = txn.sign(sender_private_key)
        txid = self.algod_client.send_transaction(signed_txn)
        
        return self.wait_for_confirmation(txid)
    
    def compile_program(self, source_code: str) -> bytes:
        """Compile TEAL source code to binary"""
        compile_response = self.algod_client.compile(source_code)
        return base64.b64decode(compile_response["result"])
