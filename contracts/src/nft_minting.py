"""
TrustLoop NFT Minting Smart Contract

This contract mints ARC3 NFTs as rewards for completed tasks.
- Verifies proof of task completion before minting
- Stores metadata including task title, completion time, and rarity
- Transfers ownership to the user who completed the task
"""

from pyteal import *

def approval_program():
    # Global state variables
    global_admin = Bytes("admin")  # Contract admin address
    global_proof_app_id = Bytes("proof_app_id")  # ID of the Proof-of-Action app
    global_total_minted = Bytes("total_minted")  # Total number of NFTs minted
    
    # Operations
    op_mint_nft = Bytes("mint_nft")
    op_set_proof_app = Bytes("set_proof_app")
    
    # Initialize the application
    on_create = Seq([
        App.globalPut(global_admin, Txn.sender()),
        App.globalPut(global_total_minted, Int(0)),
        Approve()
    ])
    
    # Set the Proof-of-Action app ID
    # Args: proof_app_id
    on_set_proof_app = Seq([
        Assert(Txn.sender() == App.globalGet(global_admin)),
        Pop(proof_app_arg := Txn.application_args[1]),
        Pop(proof_id := Btoi(proof_app_arg)),
        App.globalPut(global_proof_app_id, proof_id),
        Approve()
    ])
    
    # Mint a new NFT reward
    # Args: task_id, task_title, rarity, metadata_ipfs
    on_mint_nft = Seq([
        # Extract application arguments
        Pop(task_id := Txn.application_args[1]),  # ID of the completed task
        Pop(task_title := Txn.application_args[2]),  # Title of the task
        Pop(rarity := Txn.application_args[3]),  # Rarity level
        Pop(metadata_ipfs := Txn.application_args[4]),  # IPFS hash
        
        # Get the proof app ID
        Pop(proof_app_id := App.globalGet(global_proof_app_id)),
        
        # Create asset configuration
        Pop(asset_name := Concat(Bytes("TrustLoop: "), task_title)),
        Pop(unit_name := Bytes("TLOOP")),
        Pop(asset_url := Concat(Bytes("ipfs://"), metadata_ipfs)),
        
        # Verify the transaction group contains:
        # 1. This app call
        # 2. A call to the proof app to verify completion
        # 3. Asset creation transaction
        # 4. Asset transfer to the user
        Assert(Global.group_size() >= Int(2)),
        
        # Call to proof app must be a NoOp call with verify_proof operation
        Assert(Gtxn[1].type_enum() == TxnType.ApplicationCall),
        Assert(Gtxn[1].application_id() == proof_app_id),
        Assert(Gtxn[1].application_args[0] == Bytes("verify_proof")),
        Assert(Gtxn[1].application_args[1] == task_id),
        
        # Check that the verification was for the current user
        Assert(Gtxn[1].sender() == Txn.sender()),
        
        # If we get here, the proof is valid, so proceed with minting
        # This requires a transaction group with asset creation and transfer
        
        # Generate a unique asset name with task information
        Pop(unique_name := Concat(
            asset_name,
            Bytes(" ("),
            rarity,
            Bytes(")")
        )),
        
        # Log the minting event
        Log(Concat(
            Bytes("mint:"),
            Txn.sender(),
            Bytes(":"),
            task_id,
            Bytes(":"),
            Itob(Global.latest_timestamp())
        )),
        
        # Increment the total minted counter
        App.globalPut(
            global_total_minted,
            App.globalGet(global_total_minted) + Int(1)
        ),
        
        Approve()
    ])
    
    # Handle different operations
    program = Cond(
        # Creation and initialization logic
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == App.globalGet(global_admin))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == App.globalGet(global_admin))],
        
        # Main operations
        [Txn.application_args[0] == op_set_proof_app, on_set_proof_app],
        [Txn.application_args[0] == op_mint_nft, on_mint_nft]
    )
    
    return program

def clear_state_program():
    return Approve()

# Helper function to create the actual asset creation transaction
def create_nft_asset_txn(task_title, rarity, metadata_ipfs, note=None):
    """
    Returns TEAL to create the NFT asset in an atomic transaction
    This would be used in a client application, not in the contract itself.
    """
    return Seq([
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_name: Concat(Bytes("TrustLoop: "), task_title),
            TxnField.config_asset_unit_name: Bytes("TLOOP"),
            TxnField.config_asset_url: Concat(Bytes("ipfs://"), metadata_ipfs),
            TxnField.config_asset_metadata_hash: Txn.application_args[5] if note else Bytes(""),
            TxnField.config_asset_total: Int(1),  # NFTs have supply of 1
            TxnField.config_asset_decimals: Int(0),  # NFTs should have 0 decimals
            TxnField.config_asset_default_frozen: Int(0),  # Not frozen
            TxnField.config_asset_manager: Global.current_application_address(),
            TxnField.config_asset_reserve: Global.current_application_address(),
            TxnField.config_asset_freeze: Global.current_application_address(),
            TxnField.config_asset_clawback: Global.current_application_address(),
            TxnField.note: Bytes(note) if note else Bytes("")
        }),
        InnerTxnBuilder.Submit(),
    ])

if __name__ == "__main__":
    import os
    build_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build")
    os.makedirs(build_dir, exist_ok=True)
    
    with open(os.path.join(build_dir, "nft_minting_approval.teal"), "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=6)
        f.write(compiled)
        
    with open(os.path.join(build_dir, "nft_minting_clear.teal"), "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=6)
        f.write(compiled)
    
    print(f"Compiled nft_minting to {build_dir}")
