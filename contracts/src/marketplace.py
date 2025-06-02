"""
TrustLoop NFT Marketplace Smart Contract

This contract enables:
- Users to list their NFTs for sale
- Buyers to purchase listed NFTs
- Automatic transfers of assets and ALGO
- Royalty payments to creators
"""

from pyteal import *

def approval_program():
    # Global state variables
    global_admin = Bytes("admin")  # Contract admin address
    global_creator_address = Bytes("creator_address")  # Creator wallet for royalties
    global_royalty_percentage = Bytes("royalty_percentage")  # Royalty percentage (in basis points, e.g., 200 = 2%)
    global_total_sales = Bytes("total_sales")  # Total number of sales
    global_total_volume = Bytes("total_volume")  # Total volume in microALGO
    
    # Asset listing information stored in local state
    # We'll store up to 7 asset IDs directly (asset_1, asset_2, etc.) with their prices as uint (price_1, price_2, etc.)
    # We'll also maintain a bitmap to track which slots are used
    local_list_count = Bytes("list_count")  # Number of assets listed by this user
    local_asset_bitmap = Bytes("asset_bitmap")  # Bitmap showing which slots are used
    local_asset_prefix = Bytes("asset_")  # Prefix for asset IDs in local state
    local_price_prefix = Bytes("price_")  # Prefix for prices in local state
    
    # Application call operations
    op_list_nft = Bytes("list_nft")
    op_delist_nft = Bytes("delist_nft")
    op_buy_nft = Bytes("buy_nft")
    op_set_creator = Bytes("set_creator")
    op_set_royalty = Bytes("set_royalty")
    
    # Initialize the application
    on_create = Seq([
        App.globalPut(global_admin, Txn.sender()),
        App.globalPut(global_creator_address, Txn.sender()),  # Default creator is admin
        App.globalPut(global_royalty_percentage, Int(200)),  # 2% default royalty
        App.globalPut(global_total_sales, Int(0)),
        App.globalPut(global_total_volume, Int(0)),
        Approve()
    ])
    
    # Opt-in to the application (initialize local state)
    on_opt_in = Seq([
        App.localPut(Txn.sender(), local_list_count, Int(0)),
        App.localPut(Txn.sender(), local_asset_bitmap, Int(0)),
        Approve()
    ])
    
    # Set the creator address for royalties
    # Args: creator_address
    on_set_creator = Seq([
        Assert(Txn.sender() == App.globalGet(global_admin)),
        # Get the creator address from accounts array
        Pop(account_idx := Int(1)),  # Use an integer literal for the index
        Pop(creator_addr := Txn.accounts[account_idx]),  # Now fetch the account using the integer index
        App.globalPut(global_creator_address, creator_addr),
        Approve()
    ])
    
    # Set the royalty percentage (in basis points)
    # Args: royalty_percentage
    on_set_royalty = Seq([
        Assert(Txn.sender() == App.globalGet(global_admin)),
        Pop(royalty_arg := Txn.application_args[1]),
        Pop(royalty := Btoi(royalty_arg)),
        Assert(And(
            royalty >= Int(0),
            royalty <= Int(3000)  # Max 30% royalty
        )),
        App.globalPut(global_royalty_percentage, royalty),
        Approve()
    ])
    
    # List an NFT for sale
    # Args: asset_id, price
    on_list_nft = Seq([
        # Parse inputs
        Pop(asset_id := Btoi(Txn.application_args[1])),
        Pop(price := Btoi(Txn.application_args[2])),
        
        # Verify the transaction group contains:
        # 1. This app call
        # 2. Asset transfer (opt-in) from contract to itself for the asset
        Assert(Global.group_size() >= Int(2)),
        Assert(Gtxn[1].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[1].asset_amount() == Int(0)),  # opt-in transfer of 0
        Assert(Gtxn[1].xfer_asset() == asset_id),
        Assert(Gtxn[1].asset_receiver() == Global.current_application_address()),
        
        # Verify user owns the NFT
        Assert(Gtxn[1].sender() == Txn.sender()),
        
        # Get current listing count and bitmap
        Pop(current_count := App.localGet(Txn.sender(), local_list_count)),
        Pop(current_bitmap := App.localGet(Txn.sender(), local_asset_bitmap)),
        
        # We can only support up to 7 listings per user with this approach
        Assert(current_count < Int(7)),
        
        # Find the first available slot (bit not set in bitmap)
        # For simplicity, we'll just try slots 0-6 sequentially
        # In a more optimized implementation, you'd find the first zero bit in the bitmap
        Pop(slot_found := Int(0)),
        Pop(slot_index := Int(0)),
        
        # Loop through potential slots to find one that's free
        For(Pop(slot_index := Int(0)), slot_index < Int(7), Pop(slot_index := slot_index + Int(1))).Do(Seq([
            # Check if this slot is used
            Pop(bit_mask := Int(1) << slot_index),
            Pop(slot_used := (current_bitmap & bit_mask) != Int(0)),
            
            # If slot is free, use it
            If(Not(slot_used),
                Seq([
                    Pop(slot_found := Int(1)),
                    # Store asset ID in this slot
                    App.localPut(Txn.sender(), Concat(local_asset_prefix, Itob(slot_index)), asset_id),
                    # Store price in this slot
                    App.localPut(Txn.sender(), Concat(local_price_prefix, Itob(slot_index)), price),
                    # Update bitmap to mark slot as used
                    App.localPut(Txn.sender(), local_asset_bitmap, current_bitmap | bit_mask),
                    # Break out of loop
                    Break()
                ])
            )
        ])),
        
        # Make sure we found a slot
        Assert(slot_found),
        
        # Increment listing count
        App.localPut(
            Txn.sender(), 
            local_list_count, 
            current_count + Int(1)
        ),
        
        # Log the listing
        Log(Concat(
            Bytes("list:"),
            Txn.sender(),
            Bytes(":"),
            Itob(asset_id),
            Bytes(":"),
            Itob(price)
        )),
        
        Approve()
    ])
    
    # Remove NFT listing
    # Args: asset_id
    on_delist_nft = Seq([
        # Parse inputs
        Pop(asset_id := Btoi(Txn.application_args[1])),
        
        # Get current listing count and bitmap
        Pop(current_count := App.localGet(Txn.sender(), local_list_count)),
        Pop(current_bitmap := App.localGet(Txn.sender(), local_asset_bitmap)),
        
        # Find which slot contains this asset ID
        Pop(slot_found := Int(0)),
        Pop(slot_index := Int(0)),
        Pop(found_slot_index := Int(0)),
        
        # Loop through slots to find the one with this asset ID
        For(Pop(slot_index := Int(0)), slot_index < Int(7), Pop(slot_index := slot_index + Int(1))).Do(Seq([
            # Check if this slot is used
            Pop(bit_mask := Int(1) << slot_index),
            Pop(slot_used := (current_bitmap & bit_mask) != Int(0)),
            
            # If slot is used, check if it's for this asset
            If(slot_used,
                Seq([
                    # Check if this slot contains the asset we're looking for
                    Pop(slot_asset_id := App.localGet(Txn.sender(), Concat(local_asset_prefix, Itob(slot_index)))),
                    If(slot_asset_id == asset_id,
                        Seq([
                            Pop(slot_found := Int(1)),
                            Pop(found_slot_index := slot_index),
                            # Break out of loop
                            Break()
                        ])
                    )
                ])
            )
        ])),
        
        # Verify the asset was found in a slot
        Assert(slot_found),
        
        # Clear this slot
        App.localDel(Txn.sender(), Concat(local_asset_prefix, Itob(found_slot_index))),
        App.localDel(Txn.sender(), Concat(local_price_prefix, Itob(found_slot_index))),
        
        # Update bitmap to mark slot as free
        Pop(bit_mask := Int(1) << found_slot_index),
        App.localPut(Txn.sender(), local_asset_bitmap, current_bitmap & ~bit_mask),
        
        # Decrement listing count
        App.localPut(
            Txn.sender(), 
            local_list_count, 
            current_count - Int(1)
        ),
        
        # Return the asset to the lister
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_receiver: Txn.sender(),
            TxnField.asset_amount: Int(1),
            TxnField.xfer_asset: asset_id,
        }),
        InnerTxnBuilder.Submit(),
        
        # Log the delisting
        Log(Concat(
            Bytes("delist:"),
            Txn.sender(),
            Bytes(":"),
            Itob(asset_id)
        )),
        
        Approve()
    ])
    
    # Buy a listed NFT
    # Args: asset_id, seller_address
    on_buy_nft = Seq([
        # Parse inputs
        Pop(asset_id := Btoi(Txn.application_args[1])),
        Pop(account_idx := Int(1)),
        Pop(seller := Txn.accounts[account_idx]),  # The seller account must be passed as an account
        
        # Find which slot contains this asset ID for the seller
        Pop(seller_bitmap := App.localGet(seller, local_asset_bitmap)),
        Pop(slot_found := Int(0)),
        Pop(slot_index := Int(0)),
        Pop(found_slot_index := Int(0)),
        Pop(price := Int(0)),
        
        # Loop through slots to find the one with this asset ID
        For(Pop(slot_index := Int(0)), slot_index < Int(7), Pop(slot_index := slot_index + Int(1))).Do(Seq([
            # Check if this slot is used
            Pop(bit_mask := Int(1) << slot_index),
            Pop(slot_used := (seller_bitmap & bit_mask) != Int(0)),
            
            # If slot is used, check if it's for this asset
            If(slot_used,
                Seq([
                    # Check if this slot contains the asset we're looking for
                    Pop(slot_asset_id := App.localGet(seller, Concat(local_asset_prefix, Itob(slot_index)))),
                    If(slot_asset_id == asset_id,
                        Seq([
                            Pop(slot_found := Int(1)),
                            Pop(found_slot_index := slot_index),
                            Pop(price := App.localGet(seller, Concat(local_price_prefix, Itob(slot_index)))),
                            # Break out of loop
                            Break()
                        ])
                    )
                ])
            )
        ])),
        
        # Verify the asset was found and has a valid price
        Assert(slot_found),
        Assert(price > Int(0)),
        
        # Verify the transaction group contains:
        # 1. This app call
        # 2. Payment to the contract for the NFT
        Assert(Global.group_size() >= Int(2)),
        Assert(Gtxn[1].type_enum() == TxnType.Payment),
        Assert(Gtxn[1].amount() >= price),  # Ensure enough ALGO is sent
        Assert(Gtxn[1].receiver() == Global.current_application_address()),
        Assert(Gtxn[1].sender() == Txn.sender()),  # Buyer must be the app caller
        
        # Calculate royalty amount
        Pop(royalty_bps := App.globalGet(global_royalty_percentage)),
        Pop(royalty_amount := Div(Mul(price, royalty_bps), Int(10000))),
        Pop(seller_amount := Minus(price, royalty_amount)),
        
        # Clear the listing from the seller's local state
        App.localDel(seller, Concat(local_asset_prefix, Itob(found_slot_index))),
        App.localDel(seller, Concat(local_price_prefix, Itob(found_slot_index))),
        
        # Update seller's bitmap to mark slot as free
        Pop(bit_mask := Int(1) << found_slot_index),
        App.localPut(seller, local_asset_bitmap, seller_bitmap & ~bit_mask),
        
        # Decrement seller's listing count
        Pop(seller_count := App.localGet(seller, local_list_count)),
        App.localPut(
            seller, 
            local_list_count, 
            seller_count - Int(1)
        ),
        
        # Transfer the NFT to the buyer
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_receiver: Txn.sender(),
            TxnField.asset_amount: Int(1),
            TxnField.xfer_asset: asset_id,
        }),
        InnerTxnBuilder.Submit(),
        
        # Pay the seller
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.amount: seller_amount,
            TxnField.receiver: seller,
        }),
        InnerTxnBuilder.Submit(),
        
        # Pay the royalty to creator
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.amount: royalty_amount,
            TxnField.receiver: App.globalGet(global_creator_address),
        }),
        InnerTxnBuilder.Submit(),
        
        # Update global stats
        App.globalPut(
            global_total_sales, 
            App.globalGet(global_total_sales) + Int(1)
        ),
        App.globalPut(
            global_total_volume, 
            App.globalGet(global_total_volume) + price
        ),
        
        # Log the sale
        Log(Concat(
            Bytes("sale:"),
            Txn.sender(),  # buyer
            Bytes(":"),
            seller,  # seller
            Bytes(":"),
            Itob(asset_id),
            Bytes(":"),
            Itob(price)
        )),
        
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
        [Txn.application_args[0] == op_list_nft, on_list_nft],
        [Txn.application_args[0] == op_delist_nft, on_delist_nft],
        [Txn.application_args[0] == op_buy_nft, on_buy_nft],
        [Txn.application_args[0] == op_set_creator, on_set_creator],
        [Txn.application_args[0] == op_set_royalty, on_set_royalty]
    )
    
    return program

def clear_state_program():
    return Approve()

if __name__ == "__main__":
    import os
    build_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build")
    os.makedirs(build_dir, exist_ok=True)
    
    with open(os.path.join(build_dir, "marketplace_approval.teal"), "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=6)
        f.write(compiled)
        
    with open(os.path.join(build_dir, "marketplace_clear.teal"), "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=6)
        f.write(compiled)
    
    print(f"Compiled marketplace to {build_dir}")
