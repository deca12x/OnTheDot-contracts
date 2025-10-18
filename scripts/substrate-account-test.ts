import { ethers } from "hardhat";

async function main() {
  console.log("🔑 Substrate Account Test");
  console.log("=========================");

  // Get current account info
  const [currentSigner] = await ethers.getSigners();
  console.log("Current Ethereum account:", currentSigner.address);

  // Create a new random account for testing
  const newWallet = ethers.Wallet.createRandom();
  const newSigner = newWallet.connect(ethers.provider);

  console.log("New test account:", newSigner.address);
  console.log("New account private key:", newWallet.privateKey);

  try {
    // Check balances
    const currentBalance = await ethers.provider.getBalance(
      currentSigner.address
    );
    const newBalance = await ethers.provider.getBalance(newSigner.address);

    console.log("\n💰 Balances:");
    console.log(
      "- Current account:",
      ethers.formatEther(currentBalance),
      "PAS"
    );
    console.log("- New account:", ethers.formatEther(newBalance), "PAS");

    // Send some PAS to the new account for testing
    console.log("\n💸 Funding new account...");

    const feeData = await ethers.provider.getFeeData();
    const fundingAmount = ethers.parseEther("10"); // Send 10 PAS

    const fundingTx = await currentSigner.sendTransaction({
      to: newSigner.address,
      value: fundingAmount,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      gasLimit: 21000,
      type: 2,
    });

    console.log("Funding tx sent:", fundingTx.hash);
    const fundingReceipt = await fundingTx.wait();
    console.log("✅ Funding confirmed in block:", fundingReceipt?.blockNumber);

    // Check new balance
    const newBalanceAfter = await ethers.provider.getBalance(newSigner.address);
    console.log(
      "New account balance after funding:",
      ethers.formatEther(newBalanceAfter),
      "PAS"
    );

    // Now test contract interaction with the new account
    console.log("\n🏗️ Testing contract with new account...");

    const CONTRACT_ADDRESS = "0x03692bE1A49D9546004533eCE1B39c2bB6f9d202";
    const EventDeposit = await ethers.getContractFactory("EventDeposit");
    const eventDeposit = EventDeposit.attach(CONTRACT_ADDRESS);

    // Check if new account has deposited
    const hasDeposited = await eventDeposit.hasDeposited(newSigner.address);
    console.log("New account has deposited:", hasDeposited);

    if (!hasDeposited) {
      const depositAmount = await eventDeposit.DEPOSIT_AMOUNT();
      console.log("Making deposit with new account...");

      const depositTx = await eventDeposit.connect(newSigner).deposit({
        value: depositAmount,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 100000,
        type: 2,
      });

      console.log("✅ Deposit tx sent:", depositTx.hash);
      const depositReceipt = await depositTx.wait();
      console.log(
        "✅ Deposit confirmed in block:",
        depositReceipt?.blockNumber
      );

      // Verify deposit
      const hasDepositedAfter = await eventDeposit.hasDeposited(
        newSigner.address
      );
      console.log("✅ Deposit successful:", hasDepositedAfter);

      console.log(
        "\n🎉 SUCCESS! Contract interaction works with fresh account!"
      );
      console.log(
        "This suggests the issue is with the original account, not the network."
      );
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.code) console.error("Code:", error.code);
    if (error.reason) console.error("Reason:", error.reason);

    if (error.message.includes("InvalidTransaction::Payment")) {
      console.log("\n💡 Still getting payment error - this suggests:");
      console.log("1. Network-wide EVM compatibility issue");
      console.log("2. All accounts need mapping regardless of origin");
      console.log("3. Existential deposit requirements");
    }
  }
}

main().catch(console.error);
