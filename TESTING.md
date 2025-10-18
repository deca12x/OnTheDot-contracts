# Testing Guide for OnTheDot Smart Contracts

This guide explains how to test the deposit and redeem functionality of the EventDeposit contract.

## Prerequisites

1. **Deploy the contract first**:

   ```bash
   npm run deploy:testnet
   ```

2. **Get the contract address** from the deployment output

3. **Have PAS tokens** in your wallet from the [Polkadot Faucet](https://faucet.polkadot.io/)

## Testing Scripts

### 1. Testing Deposits (`deposit.ts`)

This script tests the deposit functionality and listens for `DepositMade` events.

#### Usage Options:

**Option A: Pass contract address as argument**

```bash
# Local network
npm run test:deposit:local -- <CONTRACT_ADDRESS>

# Testnet
npm run test:deposit:testnet -- <CONTRACT_ADDRESS>
```

**Option B: Set environment variable**

```bash
export CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
npm run test:deposit:testnet
```

**Option C: Direct Hardhat command**

```bash
npx hardhat run scripts/deposit.ts --network polkadotHubTestnet -- <CONTRACT_ADDRESS>
```

#### What the script does:

- ✅ Checks if user already deposited
- ✅ Verifies redemption period is active
- ✅ Shows contract status and balance
- ✅ Listens for `DepositMade` events
- ✅ Makes a 1 DOT deposit
- ✅ Verifies deposit was successful
- ✅ Shows updated contract state

#### Expected Output:

```
🏦 Testing Deposit Function
==========================
Contract Address: 0x1234...
Depositor Address: 0x5678...
Depositor Balance: 10.0 DOT

📋 Contract Status:
- Required Deposit: 1.0 DOT
- Redemption Active: true
- User Already Deposited: false
- Current Depositors Count: 0

🎧 Setting up event listeners...

💰 Making deposit...
Sending 1.0 DOT to contract...
📝 Transaction sent: 0xabcd...
⏳ Waiting for confirmation...
✅ Transaction confirmed in block: 12345

🎉 DepositMade Event Received!
- User: 0x5678...
- Amount: 1.0 DOT
- Timestamp: 2025-10-18T10:30:00.000Z
- Transaction Hash: 0xabcd...
- Block Number: 12345

🔍 Verifying deposit...
- User Deposited: true
- Total Depositors: 1
- Contract Balance: 1.0 DOT
- All Depositors: ["0x5678..."]

🎊 Deposit successful!
```

### 2. Testing Redemptions (`redeem.ts`)

This script tests the redeem functionality and listens for both `DepositRedeemed` and `AdminWithdrawal` events.

#### Usage Options:

**Option A: Pass contract address as argument**

```bash
# Local network
npm run test:redeem:local -- <CONTRACT_ADDRESS>

# Testnet
npm run test:redeem:testnet -- <CONTRACT_ADDRESS>
```

**Option B: Set environment variable**

```bash
export CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
npm run test:redeem:testnet
```

**Option C: Direct Hardhat command**

```bash
npx hardhat run scripts/redeem.ts --network polkadotHubTestnet -- <CONTRACT_ADDRESS>
```

#### What the script does:

- ✅ Checks if user has deposited
- ✅ Determines if redemption is before/after deadline
- ✅ Shows all contract status and balances
- ✅ Listens for `DepositRedeemed` and `AdminWithdrawal` events
- ✅ Makes redemption call
- ✅ Shows balance changes for user/admin/contract
- ✅ Verifies redemption outcome

#### Expected Output (Before Deadline):

```
🎫 Testing Redeem Function
==========================
Contract Address: 0x1234...
Redeemer Address: 0x5678...
Redeemer Balance: 9.0 DOT

📋 Contract Status:
- Deposit Amount: 1.0 DOT
- Redemption Deadline: 2025-10-19T13:00:00.000Z
- Redemption Active: true
- User Has Deposited: true
- Current Depositors Count: 1
- Contract Balance: 1.0 DOT
- All Depositors: ["0x5678..."]

✅ Redemption is BEFORE deadline - user will get their deposit back

💰 Balances Before Redemption:
- User: 9.0 DOT
- Admin: 100.0 DOT
- Contract: 1.0 DOT

🎫 Making redemption...
📝 Transaction sent: 0xdef0...
✅ Transaction confirmed in block: 12346

🎉 DepositRedeemed Event Received!
- User: 0x5678...
- Amount: 1.0 DOT
- Timestamp: 2025-10-18T10:35:00.000Z

💰 Balances After Redemption:
- User: 9.98 DOT (got deposit back minus gas)
- Admin: 100.0 DOT
- Contract: 0.0 DOT

🎊 Individual redemption successful! User got their deposit back.
```

#### Expected Output (After Deadline):

```
⏰ Redemption is AFTER deadline - all funds will go to admin

🏦 AdminWithdrawal Event Received!
- Admin: 0x9abc...
- Amount: 5.0 DOT
- Timestamp: 2025-10-20T14:00:00.000Z

🏦 Admin withdrawal successful! All funds transferred to admin.
```

## Testing Scenarios

### Scenario 1: Normal Flow

1. Deploy contract
2. Make deposit (should succeed)
3. Redeem before deadline (should return 1 DOT to user)

### Scenario 2: Multiple Deposits

1. Deploy contract
2. Make deposits from multiple accounts
3. Redeem from different accounts before deadline

### Scenario 3: After Deadline

1. Deploy contract with past deadline OR wait until deadline passes
2. Make deposit (should fail if after deadline)
3. Try to redeem (should send all funds to admin)

### Scenario 4: Error Cases

1. Try to deposit twice from same account (should fail)
2. Try to redeem without depositing (should fail)
3. Try to deposit wrong amount (should fail)

## Environment Setup

Create a `.env` file:

```bash
# Private key for testing (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Contract address (optional, can pass as argument)
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Admin address (optional, defaults to deployer)
ADMIN_ADDRESS=0x9876543210987654321098765432109876543210
```

## Troubleshooting

### Common Errors:

1. **"Must send exactly 1 DOT"**

   - Make sure you have enough balance
   - The contract requires exactly 1 DOT (1 ether in wei)

2. **"User has already deposited"**

   - Each address can only deposit once
   - Use a different account or deploy a new contract

3. **"No deposit found for this address"**

   - Make a deposit first before trying to redeem
   - Check if you're using the correct account

4. **"Deposit period has ended"**
   - The redemption deadline has passed
   - Deploy a new contract with a future deadline

### Gas Issues:

- The scripts set reasonable gas limits
- If transactions fail, try increasing gas limits in the scripts
- Make sure you have enough PAS tokens for gas fees

## Integration with Frontend

These scripts demonstrate the exact same function calls your Next.js frontend will make:

```javascript
// Deposit
await contract.deposit({ value: ethers.parseEther("1") });

// Redeem
await contract.redeem();

// Check if user deposited
const hasDeposited = await contract.hasDeposited(userAddress);

// Listen for events
contract.on("DepositMade", (user, amount, timestamp) => {
  console.log("Deposit made by", user);
});
```

The event listeners in these scripts show exactly what events your frontend should listen for to provide real-time feedback to users.
