import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x03692bE1A49D9546004533eCE1B39c2bB6f9d202";

async function main() {
  console.log("🚀 EIP-1559 Transaction Test");
  console.log("============================");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  try {
    // Get network fee data
    const feeData = await ethers.provider.getFeeData();
    const nonce = await ethers.provider.getTransactionCount(signer.address);

    console.log("\n⛽ Fee Data:");
    console.log("- Gas price:", feeData.gasPrice?.toString(), "wei");
    console.log("- Max fee per gas:", feeData.maxFeePerGas?.toString(), "wei");
    console.log(
      "- Max priority fee:",
      feeData.maxPriorityFeePerGas?.toString(),
      "wei"
    );
    console.log("- Account nonce:", nonce);

    // Test 1: Simple EIP-1559 transaction (0 PAS to self)
    console.log("\n🧪 Test 1: Simple EIP-1559 Transfer");

    const eip1559Tx = {
      to: signer.address,
      value: 0,
      gasLimit: 21000,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      nonce: nonce,
      type: 2, // EIP-1559 transaction type
    };

    console.log("EIP-1559 transaction params:", eip1559Tx);

    const simpleTx = await signer.sendTransaction(eip1559Tx);
    console.log("✅ Simple EIP-1559 tx sent:", simpleTx.hash);

    const simpleReceipt = await simpleTx.wait();
    console.log(
      "✅ Simple EIP-1559 tx confirmed in block:",
      simpleReceipt?.blockNumber
    );
    console.log("Gas used:", simpleReceipt?.gasUsed.toString());

    // Test 2: Contract interaction with EIP-1559
    console.log("\n🏗️ Test 2: Contract Deposit with EIP-1559");

    const EventDeposit = await ethers.getContractFactory("EventDeposit");
    const eventDeposit = EventDeposit.attach(CONTRACT_ADDRESS);

    const hasDeposited = await eventDeposit.hasDeposited(signer.address);
    console.log("Has deposited:", hasDeposited);

    if (!hasDeposited) {
      const depositAmount = await eventDeposit.DEPOSIT_AMOUNT();
      console.log("Deposit amount:", ethers.formatEther(depositAmount), "PAS");

      const contractTx = await eventDeposit.connect(signer).deposit({
        value: depositAmount,
        gasLimit: 100000,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        type: 2, // EIP-1559
      });

      console.log("✅ Contract deposit tx sent:", contractTx.hash);

      const contractReceipt = await contractTx.wait();
      console.log(
        "✅ Contract deposit confirmed in block:",
        contractReceipt?.blockNumber
      );
      console.log("Gas used:", contractReceipt?.gasUsed.toString());

      // Verify deposit
      const newHasDeposited = await eventDeposit.hasDeposited(signer.address);
      console.log("✅ Deposit successful:", newHasDeposited);

      // Check contract balance
      const contractBalance = await ethers.provider.getBalance(
        CONTRACT_ADDRESS
      );
      console.log(
        "Contract balance:",
        ethers.formatEther(contractBalance),
        "PAS"
      );
    } else {
      console.log("✅ User already has a deposit!");

      // Test redemption
      console.log("\n🎫 Test 3: Redemption with EIP-1559");

      const redeemTx = await eventDeposit.connect(signer).redeem({
        gasLimit: 150000,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        type: 2,
      });

      console.log("✅ Redeem tx sent:", redeemTx.hash);

      const redeemReceipt = await redeemTx.wait();
      console.log("✅ Redeem confirmed in block:", redeemReceipt?.blockNumber);

      const finalHasDeposited = await eventDeposit.hasDeposited(signer.address);
      console.log("✅ Redemption successful:", !finalHasDeposited);
    }

    console.log("\n🎉 All tests completed successfully!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.code) console.error("Code:", error.code);
    if (error.reason) console.error("Reason:", error.reason);
  }
}

main().catch(console.error);
