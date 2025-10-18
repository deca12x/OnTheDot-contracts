import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EventDepositModule = buildModule("EventDepositModule", (m) => {
  // Get admin address from parameters or use deployer as default
  const adminAddress = m.getParameter("adminAddress");

  // Set redemption deadline to October 19, 2025 at 13:00 UTC
  const redemptionDeadline = m.getParameter(
    "redemptionDeadline",
    Math.floor(new Date("2025-10-19T13:00:00Z").getTime() / 1000)
  );

  // Deploy the EventDeposit contract
  const eventDeposit = m.contract("EventDeposit", [
    adminAddress,
    redemptionDeadline,
  ]);

  return { eventDeposit };
});

export default EventDepositModule;
