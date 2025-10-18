import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString()
  );

  // Get the admin address from environment variable or use deployer as default
  const adminAddress = process.env.ADMIN_ADDRESS || deployer.address;

  // Set redemption deadline to October 19, 2025 at 13:00 UTC
  const redemptionDeadline = Math.floor(
    new Date("2025-10-19T13:00:00Z").getTime() / 1000
  );

  console.log("Admin address will be:", adminAddress);
  console.log(
    "Redemption deadline:",
    new Date(redemptionDeadline * 1000).toISOString()
  );

  // Deploy the EventDeposit contract
  const EventDeposit = await ethers.getContractFactory("EventDeposit");
  const eventDeposit = await EventDeposit.deploy(
    adminAddress,
    redemptionDeadline
  );

  await eventDeposit.waitForDeployment();

  const contractAddress = await eventDeposit.getAddress();
  console.log("EventDeposit deployed to:", contractAddress);

  // Verify contract configuration
  const depositAmount = await eventDeposit.DEPOSIT_AMOUNT();
  const contractRedemptionDeadline = await eventDeposit.REDEMPTION_DEADLINE();
  const admin = await eventDeposit.admin();

  console.log("\nContract Configuration:");
  console.log("- Deposit Amount:", ethers.formatEther(depositAmount), "DOT");
  console.log(
    "- Redemption Deadline:",
    new Date(Number(contractRedemptionDeadline) * 1000).toISOString()
  );
  console.log("- Admin Address:", admin);
  console.log(
    "- Redemption Active:",
    Date.now() / 1000 < Number(contractRedemptionDeadline)
  );

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("Deployer:", deployer.address);
  console.log("Admin:", admin);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
