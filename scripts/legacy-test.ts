import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x03692bE1A49D9546004533eCE1B39c2bB6f9d202";

async function main() {
  console.log("🔧 Legacy Transaction Test");
  console.log("==========================");

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  const EventDeposit = await ethers.getContractFactory("EventDeposit");
  const eventDeposit = EventDeposit.attach(CONTRACT_ADDRESS);

  try {
    // Read contract state first
    const hasDeposited = await eventDeposit.hasDeposited(signer.address);
    const depositAmount = await eventDeposit.DEPOSIT_AMOUNT();

    console.log("Has deposited:", hasDeposited);
    console.log("Deposit amount:", ethers.formatEther(depositAmount), "PAS");

    if (!hasDeposited) {
      console.log("\n💰 Trying deposit with legacy transaction...");

      // Try with legacy transaction format (type 0)
      const tx = await eventDeposit.connect(signer).deposit({
        value: depositAmount,
        gasLimit: 100000,
        gasPrice: ethers.parseUnits("1", "gwei"), // Very low gas price
        type: 0, // Legacy transaction
      });

      console.log("✅ Legacy tx sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("🎉 Success! Block:", receipt?.blockNumber);

      // Check if deposit worked
      const newHasDeposited = await eventDeposit.hasDeposited(signer.address);
      console.log("✅ Deposit successful:", newHasDeposited);
    } else {
      console.log("✅ Already deposited, trying redeem...");

      const redeemTx = await eventDeposit.connect(signer).redeem({
        gasLimit: 150000,
        gasPrice: ethers.parseUnits("1", "gwei"),
        type: 0,
      });

      console.log("✅ Redeem tx sent:", redeemTx.hash);
      const redeemReceipt = await redeemTx.wait();
      console.log("🎉 Redeem success! Block:", redeemReceipt?.blockNumber);
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.code) console.error("Code:", error.code);
    if (error.reason) console.error("Reason:", error.reason);
  }
}

main().catch(console.error);
