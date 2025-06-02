#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set path to the Algorand Sandbox
SANDBOX_PATH="/Users/in615bac/Documents/TrustLoop/TrustLoop/contracts/sandbox"

# Function to check Docker status
check_docker() {
  echo -e "${CYAN}Checking Docker status...${NC}"
  if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Docker is running.${NC}"
}

# Function to check Algorand Sandbox
check_sandbox() {
  echo -e "${CYAN}Checking Algorand Sandbox installation...${NC}"
  
  if [ ! -d "$SANDBOX_PATH" ]; then
    echo -e "${RED}Algorand Sandbox not found at: $SANDBOX_PATH${NC}"
    echo -e "Please clone the Algorand Sandbox repository using:"
    echo -e "git clone https://github.com/algorand/sandbox.git"
    exit 1
  fi
  
  if [ ! -f "$SANDBOX_PATH/sandbox" ]; then
    echo -e "${RED}Algorand Sandbox script not found at: $SANDBOX_PATH/sandbox${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Algorand Sandbox installation found.${NC}"
}

# Function to start the sandbox
start_sandbox() {
  echo -e "${YELLOW}Starting Algorand Sandbox...${NC}"
  
  # Change to sandbox directory and start it
  (cd "$SANDBOX_PATH" && ./sandbox up -v)
  
  # Wait for services to be ready
  echo -e "${CYAN}Waiting for Algorand services to be ready...${NC}"
  sleep 10
  
  # Check if algod is running
  if ! curl --output /dev/null --silent --fail http://localhost:4001/v2/status -H "X-Algo-API-Token: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; then
    echo -e "${RED}Algorand node (algod) is not responding. Check sandbox logs.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Algorand Sandbox is running!${NC}"
}

# Function to stop the sandbox
stop_sandbox() {
  echo -e "${YELLOW}Stopping Algorand Sandbox...${NC}"
  (cd "$SANDBOX_PATH" && ./sandbox down)
  echo -e "${GREEN}Sandbox stopped.${NC}"
}

# Function to clean the sandbox
clean_sandbox() {
  echo -e "${YELLOW}Stopping and cleaning Algorand Sandbox...${NC}"
  (cd "$SANDBOX_PATH" && ./sandbox clean)
  echo -e "${GREEN}Sandbox cleaned.${NC}"
}

# Function to run tests
run_tests() {
  echo -e "${YELLOW}Running tests...${NC}"
  
  # Get the absolute path to the contracts directory
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  CONTRACTS_DIR="$(dirname "$SCRIPT_DIR")"
  
  # Change to the contracts directory
  cd "$CONTRACTS_DIR"
  echo -e "${CYAN}Working in directory: $(pwd)${NC}"
  
  # Verify directories exist
  if [ ! -d "src" ]; then
    echo -e "${RED}Error: 'src' directory not found in $(pwd)${NC}"
    ls -la
    return 1
  fi
  
  if [ ! -d "tests" ]; then
    echo -e "${RED}Error: 'tests' directory not found in $(pwd)${NC}"
    ls -la
    return 1
  fi
  
  # Activate Python virtual environment
  echo -e "${CYAN}Activating Python virtual environment...${NC}"
  if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    echo -e "${YELLOW}Installing dependencies...${NC}"
    if [ -f "requirements.txt" ]; then
      pip install -r requirements.txt
    else
      echo -e "${RED}Error: 'requirements.txt' not found in $(pwd)${NC}"
      ls -la
      return 1
    fi
  else
    source venv/bin/activate
  fi
  
  # Set environment variables for tests
  export ALGOD_SERVER="http://localhost:4001"
  export ALGOD_TOKEN="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  export INDEXER_SERVER="http://localhost:8980"
  export INDEXER_TOKEN=""
  
  # Compile all contracts to ensure they're up to date
  echo -e "${CYAN}Compiling smart contracts...${NC}"
  if [ -d "src" ]; then
    for contract in src/*.py; do
      if [ -f "$contract" ] && grep -q "compile_program" "$contract"; then
        echo -e "Compiling $(basename $contract)..."
        python3 "$contract"
      fi
    done
  else
    echo -e "${RED}Error: 'src' directory not found${NC}"
  fi
  
  # Run the tests initially to identify accounts that need funding
  echo -e "${CYAN}Running initial tests to identify accounts that need funding...${NC}"
  local initial_test_output=$(python3 -m unittest discover tests 2>&1)
  local test_status=$?
  
  # Check if tests failed due to underfunded accounts
  if [ $test_status -ne 0 ] && echo "$initial_test_output" | grep -q "overspend"; then
    echo -e "${YELLOW}Tests failed due to underfunded accounts. Attempting to fund accounts...${NC}"
    
    # Run the fund_test_accounts.sh script to fund accounts
    if [ -f "$SCRIPT_DIR/fund_test_accounts.sh" ]; then
      echo -e "${CYAN}Running fund_test_accounts.sh script...${NC}"
      bash "$SCRIPT_DIR/fund_test_accounts.sh"
      local funding_status=$?
      
      if [ $funding_status -ne 0 ]; then
        echo -e "${RED}Account funding failed with status $funding_status${NC}"
        echo -e "${RED}Check the fund_test_accounts.sh script and ensure the sandbox is running properly.${NC}"
        deactivate
        return $funding_status
      fi
      
      echo -e "${GREEN}Accounts funded successfully. Re-running tests...${NC}"
      
      # Re-run tests after funding accounts
      echo -e "${CYAN}Re-running tests with funded accounts...${NC}"
      python3 -m unittest discover tests
      test_status=$?
    else
      echo -e "${RED}Error: fund_test_accounts.sh script not found at $SCRIPT_DIR/fund_test_accounts.sh${NC}"
      deactivate
      return 1
    fi
  elif [ $test_status -ne 0 ]; then
    echo -e "${RED}Tests failed with status $test_status (not related to funding)${NC}"
    echo "$initial_test_output"
  else
    echo -e "${GREEN}All tests passed!${NC}"
  fi
  
  # Deactivate virtual environment
  deactivate
  
  return $test_status
}

# Main script
echo -e "${GREEN}TrustLoop Algorand Sandbox Test Runner${NC}"
echo "====================================="

# Check docker status
check_docker

# Check sandbox installation
check_sandbox

# Process command line arguments
case "$1" in
  start)
    start_sandbox
    ;;
  test)
    # First ensure sandbox is running
    start_sandbox
    run_tests
    ;;
  stop)
    stop_sandbox
    ;;
  clean)
    stop_sandbox --cleanup
    ;;
  *)
    # Default: start sandbox and run tests
    start_sandbox
    run_tests
    ;;
esac

exit 0
