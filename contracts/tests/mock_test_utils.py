import base64
from typing import List, Tuple, Dict, Any, Optional
import unittest
from unittest.mock import MagicMock, patch
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# Constants for testing with local node
ALGOD_ADDRESS = "http://localhost:4001"
ALGOD_TOKEN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
INDEXER_ADDRESS = "http://localhost:8980"
INDEXER_TOKEN = ""

class MockAlgorandTestCase(unittest.TestCase):
    """Mock test case class for Algorand smart contract tests without requiring real funding"""
    
    @classmethod
    def setUpClass(cls):
        """Set up mock Algorand client and test accounts"""
        # Create a real client for TEAL compilation but we'll mock the transaction methods
        cls.algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Mock account methods that would require real funds
        cls._mock_transaction_methods()
        
        # Create test accounts
        cls.creator_private_key, cls.creator_address = account.generate_account()
        cls.user_private_key, cls.user_address = account.generate_account()
        cls.admin_private_key, cls.admin_address = account.generate_account()
        
        # Store mnemonics for reference if needed
        cls.creator_mnemonic = mnemonic.from_private_key(cls.creator_private_key)
        cls.user_mnemonic = mnemonic.from_private_key(cls.user_private_key)
        cls.admin_mnemonic = mnemonic.from_private_key(cls.admin_private_key)
        
        # Set up virtual balances for our test accounts
        cls.mock_balances = {
            cls.creator_address: 1000000000,  # 1000 Algos
            cls.user_address: 1000000000,     # 1000 Algos
            cls.admin_address: 1000000000,    # 1000 Algos
        }
        
        # Track created application IDs
        cls.next_app_id = 1
        cls.created_apps = {}
        
        # Track created asset IDs
        cls.next_asset_id = 1
        cls.created_assets = {}
        
        # Print info about mock environment
        print("Setting up mock Algorand test environment")
        print(f"Creator address: {cls.creator_address}")
        print(f"User address: {cls.user_address}")
        print(f"Admin address: {cls.admin_address}")
    
    @classmethod
    def _mock_transaction_methods(cls):
        """Mock the transaction methods that would require real funding"""
        # We'll save the original compile method so we can still compile TEAL
        cls.original_compile = cls.algod_client.compile
        
        # Create a mock for account_info that returns our virtual balances
        def mock_account_info(address):
            if address in cls.mock_balances:
                return {"amount": cls.mock_balances[address]}
            return {"amount": 0}
        cls.algod_client.account_info = MagicMock(side_effect=mock_account_info)
    
    def wait_for_confirmation(self, txid: str) -> Dict[str, Any]:
        """Mock waiting for a transaction to be confirmed"""
        # In our mock environment, transactions are confirmed instantly
        if txid.startswith("app_create_"):
            app_id = int(txid.split("_")[-1])
            return {"application-index": app_id}
        elif txid.startswith("asset_create_"):
            asset_id = int(txid.split("_")[-1])
            return {"asset-index": asset_id}
        return {"confirmed-round": 1}
    
    def create_app(self, creator_private_key: str, approval_program: bytes, 
                  clear_program: bytes, global_schema: transaction.StateSchema,
                  local_schema: transaction.StateSchema) -> int:
        """Mock creating a new application"""
        sender = account.address_from_private_key(creator_private_key)
        
        # In our mock environment, we just assign a new app ID
        app_id = self.next_app_id
        self.next_app_id += 1
        
        # Store the app details
        self.created_apps[app_id] = {
            "creator": sender,
            "approval_program": approval_program,
            "clear_program": clear_program,
            "global_schema": global_schema,
            "local_schema": local_schema,
            "global_state": {},
            "local_state": {}
        }
        
        # Generate a fake transaction ID
        txid = f"app_create_{app_id}"
        
        # Return the new app ID
        return app_id
    
    def call_app(self, app_id: int, sender_private_key: str, app_args: List[bytes] = None,
                accounts: List[str] = None, foreign_apps: List[int] = None,
                foreign_assets: List[int] = None) -> Dict[str, Any]:
        """Mock calling an application"""
        sender = account.address_from_private_key(sender_private_key)
        
        # In a real test, we would simulate the execution of the app
        # Here, we just return a successful result
        txid = f"app_call_{app_id}_{hash(str(app_args))}"
        return self.wait_for_confirmation(txid)
    
    def opt_in_app(self, app_id: int, sender_private_key: str) -> Dict[str, Any]:
        """Mock opting in to an application"""
        sender = account.address_from_private_key(sender_private_key)
        
        # Update the app's local state to include this account
        if app_id in self.created_apps:
            if sender not in self.created_apps[app_id]["local_state"]:
                self.created_apps[app_id]["local_state"][sender] = {}
        
        txid = f"app_optin_{app_id}_{sender}"
        return self.wait_for_confirmation(txid)
    
    def create_asset(self, creator_private_key: str, asset_name: str, unit_name: str, 
                   total: int, decimals: int, default_frozen: bool = False,
                   url: str = "", metadata_hash: bytes = None) -> int:
        """Mock creating a new asset"""
        sender = account.address_from_private_key(creator_private_key)
        
        # In our mock environment, we just assign a new asset ID
        asset_id = self.next_asset_id
        self.next_asset_id += 1
        
        # Store the asset details
        self.created_assets[asset_id] = {
            "creator": sender,
            "asset_name": asset_name,
            "unit_name": unit_name,
            "total": total,
            "decimals": decimals,
            "default_frozen": default_frozen,
            "url": url,
            "metadata_hash": metadata_hash,
            "balances": {sender: total}
        }
        
        # Generate a fake transaction ID
        txid = f"asset_create_{asset_id}"
        
        # Return the new asset ID
        return asset_id
    
    def opt_in_asset(self, asset_id: int, sender_private_key: str) -> Dict[str, Any]:
        """Mock opting in to an asset"""
        sender = account.address_from_private_key(sender_private_key)
        
        # Update the asset's balances to include this account
        if asset_id in self.created_assets:
            if sender not in self.created_assets[asset_id]["balances"]:
                self.created_assets[asset_id]["balances"][sender] = 0
        
        txid = f"asset_optin_{asset_id}_{sender}"
        return self.wait_for_confirmation(txid)
    
    def compile_program(self, source_code: str) -> bytes:
        """Compile TEAL source code to binary using the real compiler"""
        # We use the real compiler for this since it doesn't require funding
        compile_response = self.original_compile(source_code)
        return base64.b64decode(compile_response["result"])
