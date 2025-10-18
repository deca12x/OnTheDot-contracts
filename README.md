# OnTheDot Smart Contracts

Smart contracts for OnTheDot - A seamless event deposit and redemption system using NFC chips on Polkadot Hub TestNet.

## Overview

OnTheDot allows users to:

1. Pay a 1 DOT deposit when registering for events
2. Redeem their deposit by tapping an NFC chip at the venue
3. Automatic admin withdrawal after the event deadline

## Contract Details

- **Network**: Polkadot Hub TestNet
- **Chain ID**: 420420422
- **RPC URL**: https://testnet-passet-hub-eth-rpc.polkadot.io
- **Block Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io/
- **Currency**: PAS (Paseo tokens)

## Smart Contract Features

### EventDeposit.sol

- **Deposit Amount**: 1 DOT (1 ether in wei)
- **Redemption Deadline**: October 19, 2025 at 13:00 UTC
- **Admin Functions**: Emergency withdrawal after deadline
- **User Functions**: Deposit and redeem

#### Key Functions

- `deposit()`: Pay 1 DOT to register for event
- `redeem()`: Redeem deposit at venue (before deadline)
- `adminWithdraw()`: Admin emergency withdrawal (after deadline)
- `hasDeposited(address)`: Check if user has deposited
- `isRedemptionActive()`: Check if redemption period is active

## Setup

### Prerequisites

- Node.js (v20+ recommended)
- npm or yarn
- A wallet with PAS tokens from the [Polkadot Faucet](https://faucet.polkadot.io/)

### Installation

```bash
npm install
```

### Environment Setup

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Add your private key to `.env`:

```bash
PRIVATE_KEY=your_private_key_without_0x_prefix
ADMIN_ADDRESS=your_admin_address_optional
```

### Compilation

```bash
npm run build
```

### Testing

```bash
npm run test
```

For coverage report:

```bash
npm run test:coverage
```

## Deployment

### Local Development

```bash
npm run deploy:local
```

### Polkadot Hub TestNet

1. Ensure you have PAS tokens in your wallet
2. Set your private key in `.env`
3. Deploy:

```bash
npm run deploy:testnet
```

### Contract Verification

After deployment, verify your contract:

```bash
npx hardhat verify --network polkadotHubTestnet <CONTRACT_ADDRESS> <ADMIN_ADDRESS>
```

## Usage Example

### Deploying with Custom Admin

```bash
ADMIN_ADDRESS=0x1234567890123456789012345678901234567890 npm run deploy:testnet
```

### Interacting with the Contract

```javascript
const contract = await ethers.getContractAt("EventDeposit", contractAddress);

// Make a deposit
await contract.deposit({ value: ethers.parseEther("1") });

// Check if user has deposited
const hasDeposited = await contract.hasDeposited(userAddress);

// Redeem deposit
await contract.redeem();
```

## Contract Architecture

```
EventDeposit
├── State Variables
│   ├── admin (address)
│   ├── DEPOSIT_AMOUNT (1 ether)
│   ├── REDEMPTION_DEADLINE (timestamp)
│   ├── hasDeposited (mapping)
│   └── depositors (array)
├── User Functions
│   ├── deposit()
│   └── redeem()
├── Admin Functions
│   ├── adminWithdraw()
│   └── changeAdmin()
└── View Functions
    ├── getDepositorsCount()
    ├── getAllDepositors()
    ├── getContractBalance()
    └── isRedemptionActive()
```

## Security Features

- **Reentrancy Protection**: Uses checks-effects-interactions pattern
- **Access Control**: Admin-only functions with proper modifiers
- **Input Validation**: Validates deposit amounts and addresses
- **Deadline Enforcement**: Time-based access control for redemptions
- **Emergency Functions**: Admin can withdraw after deadline

## Gas Optimization

- Efficient array management for depositors
- Minimal storage operations
- Optimized for frequent deposit/redeem operations

## Testing

The test suite covers:

- ✅ Contract deployment and initialization
- ✅ User deposits (valid/invalid amounts, duplicates)
- ✅ Redemptions before and after deadline
- ✅ Admin functions and access control
- ✅ Edge cases and error conditions
- ✅ Gas usage optimization

## Integration with Frontend

The contract is designed to work with the OnTheDot Next.js webapp:

1. **Civic Auth Integration**: Users authenticate with embedded wallet
2. **NFC Trigger**: `/redeem` page calls `redeem()` function
3. **Storage Sync**: Contract state syncs with `storage.json`
4. **Mobile Optimized**: Gas-efficient for mobile wallet interactions

## Troubleshooting

### Common Issues

1. **"Must send exactly 1 DOT"**: Ensure you're sending exactly 1 ether worth of PAS tokens
2. **"User has already deposited"**: Each address can only deposit once
3. **"No deposit found"**: User must deposit before attempting to redeem
4. **"Deposit period has ended"**: Deposits not allowed after deadline

### Getting Test Tokens

Visit the [Polkadot Faucet](https://faucet.polkadot.io/) to get free PAS tokens for testing.

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Links

- [Polkadot Hub Documentation](https://docs.polkadot.com/develop/smart-contracts/connect-to-polkadot/)
- [Block Explorer](https://blockscout-passet-hub.parity-testnet.parity.io/)
- [Polkadot Faucet](https://faucet.polkadot.io/)
- [OnTheDot Frontend Repository](../OnTheDot/)
