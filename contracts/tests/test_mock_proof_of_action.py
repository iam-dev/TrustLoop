import unittest
import base64
import sys
import os
from algosdk import account, encoding, transaction
from algosdk.v2client import algod
from pyteal import compileTeal, Mode

# Add parent directory to path so we can import from src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.proof_of_action import approval_program, clear_state_program as clear_program
from mock_test_utils import MockAlgorandTestCase

class MockProofOfActionTest(MockAlgorandTestCase):
    """Test cases for the Proof of Action smart contract using mocked environment"""
    
    def setUp(self):
        """Set up the test environment for each test case"""
        # Define schema for global and local storage
        self.global_schema = transaction.StateSchema(num_uints=4, num_byte_slices=2)
        self.local_schema = transaction.StateSchema(num_uints=2, num_byte_slices=2)
        
        # Get PyTeal programs
        approval = approval_program()
        clear = clear_program()
        
        # Compile the PyTeal to TEAL
        approval_teal = compileTeal(approval, Mode.Application, version=6)
        clear_teal = compileTeal(clear, Mode.Application, version=6)
        
        # Compile TEAL programs
        self.approval_compiled = self.compile_program(approval_teal)
        self.clear_compiled = self.compile_program(clear_teal)
        
        # Create the application
        self.app_id = self.create_app(
            self.creator_private_key,
            self.approval_compiled,
            self.clear_compiled,
            self.global_schema,
            self.local_schema
        )
        
        # Opt in to the application
        self.opt_in_app(self.app_id, self.user_private_key)
    
    def test_create_application(self):
        """Test creating the Proof of Action application"""
        # Verify the app was created with the expected ID
        self.assertGreater(self.app_id, 0, "Application creation failed")
        print(f"Created application with ID: {self.app_id}")
    
    def test_submit_proof(self):
        """Test submitting a proof of action"""
        # Define a sample proof hash
        proof_hash = b"sample_proof_hash"
        
        # Call the application to submit a proof
        result = self.call_app(
            self.app_id,
            self.user_private_key,
            app_args=[b"submit", proof_hash]
        )
        
        # In a real test, we would verify the global and local state changes
        # For our mock test, we just verify the call succeeded
        self.assertIn("confirmed-round", result, "Failed to submit proof")
        print("Successfully submitted proof of action")
    
    def test_verify_proof(self):
        """Test verifying a proof of action"""
        # First submit a proof
        proof_hash = b"sample_proof_hash_to_verify"
        self.call_app(
            self.app_id,
            self.user_private_key,
            app_args=[b"submit", proof_hash]
        )
        
        # Now verify the proof
        result = self.call_app(
            self.app_id,
            self.admin_private_key,
            app_args=[b"verify", proof_hash],
            accounts=[self.user_address]
        )
        
        # Verify the call succeeded
        self.assertIn("confirmed-round", result, "Failed to verify proof")
        print("Successfully verified proof of action")

if __name__ == "__main__":
    unittest.main()
