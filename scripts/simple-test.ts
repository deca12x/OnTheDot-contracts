import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x03692bE1A49D9546004533eCE1B39c2bB6f9d202";

async function main() {
  const [user] = await ethers.getSigners();

  console.log("🔍 Simple Contract Test");
  console.log("======================");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("User:", user.address);

  const EventDeposit = await ethers.getContractFactory("EventDeposit");
  const eventDeposit = EventDeposit.attach(CONTRACT_ADDRESS);

  try {
    // Just read contract state first
    console.log("\n📖 Reading contract state...");
    const hasDeposited = await eventDeposit.hasDeposited(user.address);
    const depositAmount = await eventDeposit.DEPOSIT_AMOUNT();

    console.log("- Has deposited:", hasDeposited);
    console.log("- Deposit amount:", ethers.formatEther(depositAmount), "PAS");

    if (!hasDeposited) {
      console.log("\n💰 Attempting deposit with lower gas...");

      // Try with manual gas settings
      const tx = await eventDeposit.connect(user).deposit({
        value: depositAmount,
        gasLimit: 50000,
        gasPrice: ethers.parseUnits("20", "gwei"),
      });

      console.log("✅ Transaction sent:", tx.hash);
      console.log("⏳ Waiting for confirmation...");

      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log("🎉 Success! Block:", receipt?.blockNumber);
    } else {
      console.log("✅ User already has a deposit!");
    }
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.code) {
      console.error("Code:", error.code);
    }
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main().catch(console.error);
