import { ethers } from "hardhat";

async function main() {
  console.log("🌐 Network Connection Test");
  console.log("=========================");

  try {
    // Test basic network connection
    const network = await ethers.provider.getNetwork();
    console.log("✅ Network:", network.name);
    console.log("✅ Chain ID:", network.chainId.toString());

    // Test getting block number
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("✅ Latest block:", blockNumber);

    // Test getting account
    const [signer] = await ethers.getSigners();
    console.log("✅ Signer address:", signer.address);

    // Test getting balance
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("✅ Balance:", ethers.formatEther(balance), "PAS");

    // Test getting gas price
    const gasPrice = await ethers.provider.getFeeData();
    console.log("✅ Gas price:", gasPrice.gasPrice?.toString());

    // Test simple transaction (just sending 0 PAS to self)
    console.log("\n🧪 Testing simple transaction...");
    const tx = await signer.sendTransaction({
      to: signer.address,
      value: 0,
      gasLimit: 21000,
    });

    console.log("✅ Simple tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Simple tx confirmed in block:", receipt?.blockNumber);
  } catch (error: any) {
    console.error("❌ Network test failed:", error.message);
    console.error("Code:", error.code);
  }
}

main().catch(console.error);
