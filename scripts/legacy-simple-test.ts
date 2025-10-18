import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Legacy Simple Test");
  console.log("=====================");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Balance:", ethers.formatEther(balance), "PAS");

  try {
    // Try the most basic legacy transaction possible
    console.log("\n🧪 Testing basic legacy transaction...");

    const tx = await signer.sendTransaction({
      to: signer.address,
      value: 0,
      gasLimit: 21000,
      gasPrice: 10000000, // Use the network's gas price
      // No type specified = legacy transaction (type 0)
    });

    console.log("✅ Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);

    console.log("\n🎉 SUCCESS! Legacy transaction worked!");

    // Now try contract interaction with legacy format
    console.log("\n🏗️ Testing contract with legacy transaction...");

    const CONTRACT_ADDRESS = "0x03692bE1A49D9546004533eCE1B39c2bB6f9d202";
    const EventDeposit = await ethers.getContractFactory("EventDeposit");
    const eventDeposit = EventDeposit.attach(CONTRACT_ADDRESS);

    const hasDeposited = await eventDeposit.hasDeposited(signer.address);
    console.log("Has deposited:", hasDeposited);

    if (!hasDeposited) {
      const depositAmount = await eventDeposit.DEPOSIT_AMOUNT();

      const contractTx = await eventDeposit.connect(signer).deposit({
        value: depositAmount,
        gasLimit: 100000,
        gasPrice: 10000000,
        // Legacy transaction for contract call
      });

      console.log("✅ Contract transaction sent:", contractTx.hash);
      const contractReceipt = await contractTx.wait();
      console.log(
        "✅ Contract transaction confirmed:",
        contractReceipt?.blockNumber
      );

      const newHasDeposited = await eventDeposit.hasDeposited(signer.address);
      console.log("✅ Deposit successful:", newHasDeposited);

      console.log(
        "\n🎊 FULL SUCCESS! Both simple and contract transactions work!"
      );
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("Code:", error.code);

    if (error.code === 1010) {
      console.log("\n💡 Error 1010 persists even with:");
      console.log("- Fresh account with 1000 PAS");
      console.log("- Legacy transaction format");
      console.log("- Minimal gas price");
      console.log("\nThis suggests a fundamental network compatibility issue.");
    }
  }
}

main().catch(console.error);
