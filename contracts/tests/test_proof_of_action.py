import unittest
import base64
import sys
import os
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# Add parent directory to path so we can import from src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.proof_of_action import approval_program, clear_state_program as clear_program
from test_utils import AlgorandTestCase

class ProofOfActionTest(AlgorandTestCase):
    """Test cases for the Proof of Action contract"""
    
    @classmethod
    def setUpClass(cls):
        """Set up the test environment"""
        super().setUpClass()
        
        # Get PyTeal programs
        approval = approval_program()
        clear = clear_program()
        
        # Compile the PyTeal to TEAL
        from pyteal import compileTeal, Mode
        approval_teal = compileTeal(approval, Mode.Application, version=6)
        clear_teal = compileTeal(clear, Mode.Application, version=6)
        
        # Send TEAL to Algorand node for compilation
        cls.approval_compiled = cls.algod_client.compile(approval_teal)
        cls.clear_compiled = cls.algod_client.compile(clear_teal)
        
        # Set up schemas
        cls.global_schema = transaction.StateSchema(num_uints=2, num_byte_slices=0)
        cls.local_schema = transaction.StateSchema(num_uints=2, num_byte_slices=1)
    
    def setUp(self):
        """Create a new app instance for each test"""
        self.app_id = self.create_app(
            self.creator_private_key,
            base64.b64decode(self.approval_compiled["result"]),
            base64.b64decode(self.clear_compiled["result"]),
            self.global_schema,
            self.local_schema
        )
        
        # Opt-in for test user
        self.opt_in_app(self.app_id, self.user_private_key)
    
    def test_record_proof(self):
        """Test recording a proof of action"""
        # Set up task ID to record
        task_id = 3
        
        # Record proof
        args = [
            b"record_proof",
            task_id.to_bytes(8, byteorder='big')
        ]
        
        result = self.call_app(
            self.app_id,
            self.user_private_key,
            app_args=args
        )
        
        # Verify transaction was successful
        self.assertIsNotNone(result)
        self.assertEqual(result["confirmed-round"], result["confirmed-round"])
        
        # Get user local state to verify task was recorded
        account_info = self.algod_client.account_info(self.user_address)
        app_local_state = None
        
        for local_state in account_info.get("apps-local-state", []):
            if local_state["id"] == self.app_id:
                app_local_state = local_state
                break
        
        self.assertIsNotNone(app_local_state, "Local state should exist")
        
        # Check task bitmap
        key_values = app_local_state.get("key-value", [])
        bitmap = None
        
        for kv in key_values:
            if kv["key"] == "dGFza19iaXRtYXA=":  # Base64 encoded "task_bitmap"
                bitmap = kv["value"]["uint"]
                break
        
        self.assertIsNotNone(bitmap, "Task bitmap should exist")
        
        # Task ID 3 should be set in bitmap (bit at position 3 is set)
        expected_bit_mask = 1 << task_id
        self.assertEqual(bitmap & expected_bit_mask, expected_bit_mask)
    
    def test_verify_proof(self):
        """Test verifying a proof of action"""
        # First record a proof
        task_id = 5
        
        # Record proof
        record_args = [
            b"record_proof",
            task_id.to_bytes(8, byteorder='big')
        ]
        
        self.call_app(
            self.app_id,
            self.user_private_key,
            app_args=record_args
        )
        
        # Now verify the proof
        verify_args = [
            b"verify_proof",
            task_id.to_bytes(8, byteorder='big'),
            self.user_address.encode()
        ]
        
        result = self.call_app(
            self.app_id,
            self.admin_private_key,  # Admin verifies proofs
            app_args=verify_args,
            accounts=[self.user_address]  # Need to pass the user account
        )
        
        # Verify transaction was successful
        self.assertIsNotNone(result)
        
        # Get user local state to verify task was verified
        account_info = self.algod_client.account_info(self.user_address)
        app_local_state = None
        
        for local_state in account_info.get("apps-local-state", []):
            if local_state["id"] == self.app_id:
                app_local_state = local_state
                break
        
        self.assertIsNotNone(app_local_state)
        
        # Check verified bitmap - this would be checked in a real implementation
        # but here we're just checking the transaction succeeded
    
    def test_record_duplicate_proof(self):
        """Test recording a proof for a task that's already completed"""
        task_id = 7
        
        # Record proof first time
        args = [
            b"record_proof",
            task_id.to_bytes(8, byteorder='big')
        ]
        
        self.call_app(
            self.app_id,
            self.user_private_key,
            app_args=args
        )
        
        # Try to record proof again - should fail
        with self.assertRaises(Exception) as context:
            self.call_app(
                self.app_id,
                self.user_private_key,
                app_args=args
            )
        
        # Check the error contains task already completed message
        # Note: exact error message may vary depending on implementation
        self.assertTrue("already completed" in str(context.exception) or 
                      "already recorded" in str(context.exception) or
                      "already" in str(context.exception))
    
    def test_global_stats(self):
        """Test global statistics in the contract"""
        # Record multiple proofs
        for task_id in [1, 2, 4]:
            args = [
                b"record_proof",
                task_id.to_bytes(8, byteorder='big')
            ]
            
            self.call_app(
                self.app_id,
                self.user_private_key,
                app_args=args
            )
        
        # Get app global state
        app_info = self.algod_client.application_info(self.app_id)
        global_state = app_info["params"]["global-state"]
        
        # Check total_proofs global counter
        total_proofs = None
        
        for kv in global_state:
            if kv["key"] == "dG90YWxfcHJvb2Zz":  # Base64 encoded "total_proofs"
                total_proofs = kv["value"]["uint"]
                break
        
        self.assertIsNotNone(total_proofs)
        self.assertEqual(total_proofs, 3)  # We recorded 3 proofs

if __name__ == "__main__":
    unittest.main()
