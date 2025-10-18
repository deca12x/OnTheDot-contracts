import { ethers } from "hardhat";

async function main() {
  console.log("🔬 Comprehensive Diagnostic Test");
  console.log("=================================");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  try {
    // 1. Check account balance and nonce
    const balance = await ethers.provider.getBalance(signer.address);
    const nonce = await ethers.provider.getTransactionCount(signer.address);
    const pendingNonce = await ethers.provider.getTransactionCount(
      signer.address,
      "pending"
    );

    console.log("\n📊 Account Status:");
    console.log("- Balance:", ethers.formatEther(balance), "PAS");
    console.log("- Confirmed nonce:", nonce);
    console.log("- Pending nonce:", pendingNonce);
    console.log("- Nonce gap:", pendingNonce - nonce);

    // 2. Check network status
    const network = await ethers.provider.getNetwork();
    const blockNumber = await ethers.provider.getBlockNumber();
    const feeData = await ethers.provider.getFeeData();

    console.log("\n🌐 Network Status:");
    console.log("- Chain ID:", network.chainId.toString());
    console.log("- Latest block:", blockNumber);
    console.log("- Gas price:", feeData.gasPrice?.toString(), "wei");
    console.log("- Max fee per gas:", feeData.maxFeePerGas?.toString());
    console.log(
      "- Max priority fee:",
      feeData.maxPriorityFeePerGas?.toString()
    );

    // 3. Test simple ETH transfer first (most basic transaction)
    console.log("\n🧪 Testing Simple Transfer (0 PAS to self):");

    const simpleTx = {
      to: signer.address,
      value: 0,
      gasLimit: 21000,
      gasPrice: feeData.gasPrice,
      nonce: nonce,
    };

    console.log("Transaction params:", simpleTx);

    // Try to estimate gas first
    try {
      const gasEstimate = await ethers.provider.estimateGas(simpleTx);
      console.log("✅ Gas estimate successful:", gasEstimate.toString());
    } catch (gasError: any) {
      console.log("❌ Gas estimation failed:", gasError.message);
      return;
    }

    // Try to send the transaction
    try {
      const tx = await signer.sendTransaction(simpleTx);
      console.log("✅ Simple transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("✅ Simple transaction confirmed:", receipt?.blockNumber);
    } catch (txError: any) {
      console.log("❌ Simple transaction failed:", txError.message);
      console.log("Error code:", txError.code);
      console.log("Error reason:", txError.reason);

      // If simple transfer fails, the issue is fundamental
      console.log("\n🚨 DIAGNOSIS: Basic transaction failure suggests:");
      console.log("1. Account mapping issue (Ethereum vs Substrate accounts)");
      console.log("2. Network incompatibility");
      console.log("3. RPC node sync issues");
      return;
    }

    // 4. If simple transfer works, test contract interaction
    console.log("\n🏗️ Testing Contract Interaction:");

    const CONTRACT_ADDRESS = "0x03692bE1A49D9546004533eCE1B39c2bB6f9d202";
    const EventDeposit = await ethers.getContractFactory("EventDeposit");
    const eventDeposit = EventDeposit.attach(CONTRACT_ADDRESS);

    // Test contract call (read-only)
    const hasDeposited = await eventDeposit.hasDeposited(signer.address);
    console.log("✅ Contract read successful. Has deposited:", hasDeposited);

    // Test contract transaction
    if (!hasDeposited) {
      const depositAmount = await eventDeposit.DEPOSIT_AMOUNT();

      try {
        const contractTx = await eventDeposit.connect(signer).deposit({
          value: depositAmount,
          gasLimit: 100000,
          gasPrice: feeData.gasPrice,
          nonce: nonce + 1, // Next nonce after simple transfer
        });

        console.log("✅ Contract transaction sent:", contractTx.hash);
        const contractReceipt = await contractTx.wait();
        console.log(
          "✅ Contract transaction confirmed:",
          contractReceipt?.blockNumber
        );
      } catch (contractError: any) {
        console.log("❌ Contract transaction failed:", contractError.message);
        console.log("Error code:", contractError.code);
      }
    }
  } catch (error: any) {
    console.error("❌ Diagnostic failed:", error.message);
    console.error("Code:", error.code);
  }
}

main().catch(console.error);
