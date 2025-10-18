import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x03692bE1A49D9546004533eCE1B39c2bB6f9d202";

async function main() {
  const [user] = await ethers.getSigners();

  console.log("🧪 Testing Real Contract on Polkadot Hub TestNet");
  console.log("===============================================");
  console.log("Contract Address:", CONTRACT_ADDRESS);
  console.log("User Address:", user.address);

  // Get contract instance
  const EventDeposit = await ethers.getContractFactory("EventDeposit");
  const eventDeposit = EventDeposit.attach(CONTRACT_ADDRESS);

  try {
    // Check initial state
    console.log("\n📋 Initial Contract State:");
    const userBalance = await ethers.provider.getBalance(user.address);
    const contractBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    const hasDeposited = await eventDeposit.hasDeposited(user.address);
    const admin = await eventDeposit.admin();
    const depositAmount = await eventDeposit.DEPOSIT_AMOUNT();

    console.log("- User Balance:", ethers.formatEther(userBalance), "PAS");
    console.log(
      "- Contract Balance:",
      ethers.formatEther(contractBalance),
      "PAS"
    );
    console.log("- User Has Deposited:", hasDeposited);
    console.log("- Admin Address:", admin);
    console.log(
      "- Required Deposit:",
      ethers.formatEther(depositAmount),
      "PAS"
    );

    if (!hasDeposited) {
      console.log("\n💰 Making Deposit...");
      console.log("Sending 1 PAS to contract...");

      // Set up event listener
      eventDeposit.on("DepositMade", (userAddr, amount, timestamp) => {
        console.log("🎉 DepositMade Event:");
        console.log("- User:", userAddr);
        console.log("- Amount:", ethers.formatEther(amount), "PAS");
        console.log(
          "- Time:",
          new Date(Number(timestamp) * 1000).toISOString()
        );
      });

      const tx = await eventDeposit.connect(user).deposit({
        value: depositAmount,
        gasLimit: 100000,
      });

      console.log("📝 Transaction Hash:", tx.hash);
      console.log("⏳ Waiting for confirmation...");

      const receipt = await tx.wait();
      console.log("✅ Confirmed in block:", receipt?.blockNumber);

      // Check state after deposit
      const newContractBalance = await ethers.provider.getBalance(
        CONTRACT_ADDRESS
      );
      const newHasDeposited = await eventDeposit.hasDeposited(user.address);

      console.log("\n📊 After Deposit:");
      console.log(
        "- Contract Balance:",
        ethers.formatEther(newContractBalance),
        "PAS"
      );
      console.log("- User Has Deposited:", newHasDeposited);
    } else {
      console.log("\n✅ User has already deposited!");

      console.log("\n🎫 Testing Redemption...");

      // Set up event listener for redemption
      eventDeposit.on("DepositRedeemed", (userAddr, amount, timestamp) => {
        console.log("🎉 DepositRedeemed Event:");
        console.log("- User:", userAddr);
        console.log("- Amount:", ethers.formatEther(amount), "PAS");
        console.log(
          "- Time:",
          new Date(Number(timestamp) * 1000).toISOString()
        );
      });

      const redeemTx = await eventDeposit.connect(user).redeem({
        gasLimit: 150000,
      });

      console.log("📝 Redeem Transaction Hash:", redeemTx.hash);
      console.log("⏳ Waiting for confirmation...");

      const redeemReceipt = await redeemTx.wait();
      console.log("✅ Confirmed in block:", redeemReceipt?.blockNumber);

      // Check final state
      const finalContractBalance = await ethers.provider.getBalance(
        CONTRACT_ADDRESS
      );
      const finalHasDeposited = await eventDeposit.hasDeposited(user.address);

      console.log("\n📊 After Redemption:");
      console.log(
        "- Contract Balance:",
        ethers.formatEther(finalContractBalance),
        "PAS"
      );
      console.log("- User Has Deposited:", finalHasDeposited);
    }

    console.log("\n🎊 Test completed successfully!");

    // Wait for events
    await new Promise((resolve) => setTimeout(resolve, 3000));
  } catch (error: any) {
    console.error("\n❌ Error during test:");
    console.error("Message:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
