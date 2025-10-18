import { ethers } from "hardhat";

async function main() {
  console.log("💰 Balance Check");
  console.log("================");

  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);

  console.log("Account:", signer.address);
  console.log("Balance:", ethers.formatEther(balance), "PAS");
  console.log("Balance (wei):", balance.toString());

  // Check if balance is sufficient for a 1 PAS deposit + gas
  const depositAmount = ethers.parseEther("1");
  const estimatedGas = 100000n * 22000000n; // gasLimit * maxFeePerGas
  const totalNeeded = depositAmount + estimatedGas;

  console.log("\nTransaction Requirements:");
  console.log("- Deposit amount:", ethers.formatEther(depositAmount), "PAS");
  console.log("- Estimated gas cost:", ethers.formatEther(estimatedGas), "PAS");
  console.log("- Total needed:", ethers.formatEther(totalNeeded), "PAS");
  console.log("- Sufficient balance:", balance >= totalNeeded);
}

main().catch(console.error);
