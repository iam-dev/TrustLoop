# TrustLoop E2E Testing

This directory contains end-to-end tests for the TrustLoop dApp using Playwright. These tests are designed to validate the application's functionality by simulating real user interactions, particularly focusing on Algorand blockchain transactions on the testnet.

## Setup

The e2e tests are maintained separately from the main application to keep dependencies isolated.

### Installation

```bash
# Navigate to the e2e directory
cd e2e

# Install dependencies
npm install

# Install browser drivers
npm run install:browsers
```

### Environment Configuration

Create a `.env` file in the e2e directory with the following variables:

```
# URL of the app to test
SITE_URL=http://localhost:5173

# Test wallet mnemonic (optional - for automated wallet testing)
TEST_WALLET_MNEMONIC=your test wallet mnemonic here

# Test wallet address
TEST_WALLET_ADDRESS=your test wallet address here

# Algorand testnet node URL (optional - defaults to public nodes)
ALGORAND_TESTNET_NODE=https://testnet-api.algonode.cloud
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI mode
npm run test:ui

# Run tests in headed mode (browser visible)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Show test report
npm run report
```

## Test Structure

- `tests/` - Contains all test files
  - `utils/` - Helper functions and utilities
  - `algorand-task-completion.spec.ts` - Tests for task completion flow
  - `algorand-marketplace.spec.ts` - Tests for NFT marketplace interactions

## Working with Algorand Testnet

For Algorand testnet testing, you'll need:

1. A funded testnet account - Get ALGO from the [Algorand testnet dispenser](https://bank.testnet.algorand.network/)
2. Pera Wallet or MyAlgo Wallet for interactive testing
3. For automated tests, a secure way to handle test wallet credentials

## Notes on Wallet Testing

Wallet interactions are challenging to automate as they often require user interaction with external wallet applications. The tests are structured to:

1. Work interactively during development (requiring manual wallet approvals)
2. Support potential future automation with proper test credentials

## Debugging

When tests fail, check:
1. The test report for screenshots and videos
2. Browser console logs
3. Network requests to the Algorand testnet
4. Algorand transaction details on [Algorand TestNet Explorer](https://testnet.algoexplorer.io/)
