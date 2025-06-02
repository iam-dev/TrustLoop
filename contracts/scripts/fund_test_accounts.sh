#!/usr/bin/env bash

# Script to fund test accounts from Algorand Sandbox

# Exit on error
set -e

# Default sandbox location
SANDBOX_DIR="../sandbox"

# Source directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
CONTRACTS_DIR="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

# Default funding amount in microAlgos (10 Algos)
FUNDING_AMOUNT=10000000

# Sandbox funded account (the default account in sandbox)
SANDBOX_ACCOUNT="RTXKUUW7XHQKRV7PFZ6HMSZOMMC4VF2J7MLBRENEDUUUDORZVJ5OKISRSI"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if sandbox is running
check_sandbox() {
    echo "Checking if Algorand Sandbox is running..."
    
    # Check if we can access the algod API
    if ! curl -s -f -X GET "http://localhost:4001/v2/status" -H "X-Algo-API-Token: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" > /dev/null; then
        echo -e "${RED}Error: Algorand Sandbox is not running. Please start it with ./sandbox up${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Algorand Sandbox is running.${NC}"
}

# Function to parse and extract account addresses from test output
extract_accounts() {
    echo "Extracting account addresses from test output..."
    
    # Run the marketplace test to extract the account information
    cd "$CONTRACTS_DIR"
    python3 -m unittest tests/test_marketplace.py 2>&1 | grep -A 3 "Need to fund" | grep "./sandbox" > /tmp/fund_commands.txt || true
    
    if [ ! -s /tmp/fund_commands.txt ]; then
        echo -e "${YELLOW}No accounts found that need funding.${NC}"
        echo "You may need to run the tests first to generate the account information."
        exit 0
    fi
    
    echo -e "${GREEN}Found accounts that need funding.${NC}"
}

# Function to fund accounts using sandbox CLI
fund_accounts() {
    echo "Funding test accounts..."
    
    # Check if sandbox directory exists
    if [ ! -d "$CONTRACTS_DIR/$SANDBOX_DIR" ]; then
        echo -e "${RED}Error: Sandbox directory not found at $CONTRACTS_DIR/$SANDBOX_DIR${NC}"
        echo "Please make sure the Algorand Sandbox is cloned in the contracts directory."
        exit 1
    fi
    
    # Change to sandbox directory
    cd "$CONTRACTS_DIR/$SANDBOX_DIR"
    
    # Count the number of accounts to fund
    ACCOUNT_COUNT=$(cat /tmp/fund_commands.txt | wc -l)
    echo "Found $ACCOUNT_COUNT accounts to fund."
    
    # Process each funding command
    cat /tmp/fund_commands.txt | while read -r line; do
        # Extract destination address from command
        DEST_ADDR=$(echo "$line" | awk '{print $NF}')
        
        echo "Funding account: $DEST_ADDR"
        
        # Execute the sandbox funding command
        ./sandbox goal clerk send -a "$FUNDING_AMOUNT" -f "$SANDBOX_ACCOUNT" -t "$DEST_ADDR"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Successfully funded account: $DEST_ADDR${NC}"
        else
            echo -e "${RED}Failed to fund account: $DEST_ADDR${NC}"
        fi
    done
}

# Function to verify account balances
verify_balances() {
    echo "Verifying account balances..."
    
    cd "$CONTRACTS_DIR/$SANDBOX_DIR"
    
    cat /tmp/fund_commands.txt | while read -r line; do
        DEST_ADDR=$(echo "$line" | awk '{print $NF}')
        
        BALANCE=$(./sandbox goal account balance -a "$DEST_ADDR" | grep -o '[0-9]\+ microAlgos' | awk '{print $1}')
        
        if [ "$BALANCE" -ge "$FUNDING_AMOUNT" ]; then
            echo -e "${GREEN}Account $DEST_ADDR has sufficient balance: $BALANCE microAlgos${NC}"
        else
            echo -e "${YELLOW}Account $DEST_ADDR has low balance: $BALANCE microAlgos${NC}"
        fi
    done
}

# Main execution
echo "TrustLoop Algorand Test Account Funding Script"
echo "=============================================="

# Check if sandbox is running
check_sandbox

# Extract accounts that need funding
extract_accounts

# Fund the accounts
fund_accounts

# Verify the account balances
verify_balances

echo -e "${GREEN}Done! Test accounts are now funded and ready for testing.${NC}"
echo "You can now run your tests with:"
echo "  ./scripts/sandbox_test.sh test"
