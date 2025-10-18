import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x03692bE1A49D9546004533eCE1B39c2bB6f9d202";

async function main() {
  console.log("⛽ Network Gas Test");
  console.log("==================");

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  try {
    // Get network gas price
    const feeData = await ethers.provider.getFeeData();
    console.log("Network gas price:", feeData.gasPrice?.toString(), "wei");
    console.log(
      "Network gas price:",
      ethers.formatUnits(feeData.gasPrice || 0, "gwei"),
      "gwei"
    );

    // Get nonce
    const nonce = await ethers.provider.getTransactionCount(signer.address);
    console.log("Account nonce:", nonce);

    const EventDeposit = await ethers.getContractFactory("EventDeposit");
    const eventDeposit = EventDeposit.attach(CONTRACT_ADDRESS);

    // Check if already deposited
    const hasDeposited = await eventDeposit.hasDeposited(signer.address);
    console.log("Has deposited:", hasDeposited);

    if (!hasDeposited) {
      console.log("\n💰 Attempting deposit with network gas price...");

      const depositAmount = await eventDeposit.DEPOSIT_AMOUNT();

      // Use exact network gas price
      const tx = await eventDeposit.connect(signer).deposit({
        value: depositAmount,
        gasLimit: 100000,
        gasPrice: feeData.gasPrice, // Use network's gas price
        nonce: nonce, // Explicit nonce
      });

      console.log("✅ Transaction sent:", tx.hash);
      console.log("⏳ Waiting for confirmation...");

      const receipt = await tx.wait();
      console.log("🎉 Success! Block:", receipt?.blockNumber);
      console.log("Gas used:", receipt?.gasUsed.toString());
    } else {
      console.log("✅ Already deposited!");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.code) console.error("Code:", error.code);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.data) console.error("Data:", error.data);
  }
}

main().catch(console.error);
