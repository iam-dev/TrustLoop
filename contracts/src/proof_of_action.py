"""
TrustLoop Proof-of-Action Smart Contract

This contract logs proof that a user completed a task.
- Records task completion in local state
- Prevents duplicate submissions
- Enables verification for NFT minting eligibility
"""

from pyteal import *

def approval_program():
    # Global state variables
    global_admin = Bytes("admin")  # Contract admin address
    global_total_proofs = Bytes("total_proofs")  # Total number of proofs recorded
    
    # Local state variables (per user)
    # Since Algorand limits local state to 16 keys total, we need to be efficient
    # Instead of storing each task with a prefix, we'll directly use the task ID as a key
    # We'll also store a task count and a bitmap for quick verification
    local_task_count = Bytes("task_count")  # Number of tasks completed by this user
    local_task_bitmap = Bytes("task_bitmap")  # Bitmap for quick verification
    
    # Operations
    op_record_proof = Bytes("record_proof")
    op_verify_proof = Bytes("verify_proof")
    
    # Record a new proof of action
    # Args: task_id, timestamp
    on_record_proof = Seq([
        # For simplicity, assume task_id is a small integer (0-15)
        # Convert task_id to an integer index
        Pop(t_id := Txn.application_args[1]),
        Pop(t_stamp := Txn.application_args[2]),
        Pop(task_idx := Btoi(t_id)),
        
        # Get current bitmap value (as uint)
        Pop(current_bitmap := App.localGet(Txn.sender(), local_task_bitmap)),
        
        # Check if the bit is already set (task completed)
        # Shift 1 left by task_idx positions and use bitwise AND to check if bit is set
        Pop(bit_mask := Int(1) << task_idx),
        Pop(task_bit_set := (current_bitmap & bit_mask) != Int(0)),
        
        # Reject if already completed
        If(task_bit_set,
            Reject()  # Prevent duplicate submissions
        ),
        
        # Store the task completion timestamp directly using task_id as key
        # This limits us to 14 tasks (plus task_count and bitmap)
        App.localPut(Txn.sender(), t_id, t_stamp),
        
        # Update bitmap by setting the bit for this task
        # Use bitwise OR to set the bit
        Pop(new_bitmap := current_bitmap | bit_mask),
        App.localPut(Txn.sender(), local_task_bitmap, new_bitmap),
        
        # Increment user's task count
        App.localPut(
            Txn.sender(), 
            local_task_count, 
            App.localGet(Txn.sender(), local_task_count) + Int(1)
        ),
        
        # Increment global task count
        App.globalPut(
            global_total_proofs, 
            App.globalGet(global_total_proofs) + Int(1)
        ),
        
        # Log the action for indexer tracking
        Log(Concat(
            Bytes("proof:"), 
            Txn.sender(),
            Bytes(":"),
            t_id,
            Bytes(":"),
            t_stamp
        )),
        
        Approve()
    ])
    
    # Verify if a proof exists for a user
    # Args: task_id
    on_verify_proof = Seq([
        # Convert task_id to an integer index
        Pop(t_id := Txn.application_args[1]),
        Pop(task_idx := Btoi(t_id)),
        
        # Get current bitmap value
        Pop(current_bitmap := App.localGet(Txn.sender(), local_task_bitmap)),
        
        # Check if the bit is set (task completed) using bitwise AND
        Pop(bit_mask := Int(1) << task_idx),
        Pop(task_bit_set := (current_bitmap & bit_mask) != Int(0)),
        
        # Return 1 if task is completed, 0 otherwise
        Return(task_bit_set)
    ])
    
    # Initialize the application
    on_create = Seq([
        App.globalPut(global_admin, Txn.sender()),
        App.globalPut(global_total_proofs, Int(0)),
        Approve()
    ])
    
    # Opt-in to the application (initialize local state)
    on_opt_in = Seq([
        App.localPut(Txn.sender(), local_task_count, Int(0)),
        App.localPut(Txn.sender(), local_task_bitmap, Int(0)),
        Approve()
    ])
    
    # Handle different operations
    program = Cond(
        # Creation and initialization logic
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.OptIn, on_opt_in],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == App.globalGet(global_admin))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == App.globalGet(global_admin))],
        
        # Main operations
        [Txn.application_args[0] == op_record_proof, on_record_proof],
        [Txn.application_args[0] == op_verify_proof, on_verify_proof]
    )
    
    return program

def clear_state_program():
    return Approve()

if __name__ == "__main__":
    import os
    build_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build")
    os.makedirs(build_dir, exist_ok=True)
    
    with open(os.path.join(build_dir, "proof_of_action_approval.teal"), "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=6)
        f.write(compiled)
        
    with open(os.path.join(build_dir, "proof_of_action_clear.teal"), "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=6)
        f.write(compiled)
    
    print(f"Compiled proof_of_action to {build_dir}")

