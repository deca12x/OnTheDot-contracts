import { expect } from "chai";
import { ethers } from "hardhat";
import { EventDeposit } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("EventDeposit - Simplified", function () {
  let eventDeposit: EventDeposit;
  let admin: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let REDEMPTION_DEADLINE: number;

  const DEPOSIT_AMOUNT = ethers.parseEther("1"); // 1 DOT

  beforeEach(async function () {
    [admin, user1, user2, user3] = await ethers.getSigners();

    // Set redemption deadline to 1 hour from now
    const currentTime = await time.latest();
    REDEMPTION_DEADLINE = currentTime + 3600; // 1 hour from now

    const EventDeposit = await ethers.getContractFactory("EventDeposit");
    eventDeposit = await EventDeposit.deploy(
      admin.address,
      REDEMPTION_DEADLINE
    );
    await eventDeposit.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await eventDeposit.admin()).to.equal(admin.address);
    });

    it("Should set the correct deposit amount", async function () {
      expect(await eventDeposit.DEPOSIT_AMOUNT()).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should set the correct redemption deadline", async function () {
      expect(await eventDeposit.REDEMPTION_DEADLINE()).to.equal(
        REDEMPTION_DEADLINE
      );
    });
  });

  describe("Deposit Function", function () {
    it("Should allow users to make deposits with correct amount", async function () {
      await expect(
        eventDeposit.connect(user1).deposit({ value: DEPOSIT_AMOUNT })
      )
        .to.emit(eventDeposit, "DepositMade")
        .withArgs(user1.address, DEPOSIT_AMOUNT, (await time.latest()) + 1);

      expect(await eventDeposit.hasDeposited(user1.address)).to.be.true;
    });

    it("Should reject deposits with incorrect amount", async function () {
      const wrongAmount = ethers.parseEther("0.5");
      await expect(
        eventDeposit.connect(user1).deposit({ value: wrongAmount })
      ).to.be.revertedWith("Must send exactly 1 DOT");
    });

    it("Should reject duplicate deposits from same user", async function () {
      await eventDeposit.connect(user1).deposit({ value: DEPOSIT_AMOUNT });

      await expect(
        eventDeposit.connect(user1).deposit({ value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith("User has already deposited");
    });

    it("Should allow multiple users to deposit", async function () {
      await eventDeposit.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      await eventDeposit.connect(user2).deposit({ value: DEPOSIT_AMOUNT });
      await eventDeposit.connect(user3).deposit({ value: DEPOSIT_AMOUNT });

      expect(await eventDeposit.hasDeposited(user1.address)).to.be.true;
      expect(await eventDeposit.hasDeposited(user2.address)).to.be.true;
      expect(await eventDeposit.hasDeposited(user3.address)).to.be.true;
    });

    it("Should reject deposits after deadline", async function () {
      // Fast forward to after deadline
      await time.increaseTo(REDEMPTION_DEADLINE + 1);

      await expect(
        eventDeposit.connect(user1).deposit({ value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith("Deposit period has ended");
    });
  });

  describe("Redeem Function - Before Deadline", function () {
    beforeEach(async function () {
      // Make deposits while still before deadline
      await eventDeposit.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      await eventDeposit.connect(user2).deposit({ value: DEPOSIT_AMOUNT });
    });

    it("Should allow users to redeem their deposits before deadline", async function () {
      const initialBalance = await ethers.provider.getBalance(user1.address);

      await expect(eventDeposit.connect(user1).redeem())
        .to.emit(eventDeposit, "DepositRedeemed")
        .withArgs(user1.address, DEPOSIT_AMOUNT, (await time.latest()) + 1);

      expect(await eventDeposit.hasDeposited(user1.address)).to.be.false;

      // Check that user received their deposit back (accounting for gas costs)
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should reject redemption from users who haven't deposited", async function () {
      await expect(eventDeposit.connect(user3).redeem()).to.be.revertedWith(
        "No deposit found for this address"
      );
    });

    it("Should prevent double redemption", async function () {
      await eventDeposit.connect(user1).redeem();

      await expect(eventDeposit.connect(user1).redeem()).to.be.revertedWith(
        "No deposit found for this address"
      );
    });
  });

  describe("Redeem Function - After Deadline", function () {
    beforeEach(async function () {
      // Make deposits before deadline
      await eventDeposit.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      await eventDeposit.connect(user2).deposit({ value: DEPOSIT_AMOUNT });

      // Move past deadline
      await time.increaseTo(REDEMPTION_DEADLINE + 1);
    });

    it("Should send all funds to admin when ANYONE calls redeem after deadline", async function () {
      const initialAdminBalance = await ethers.provider.getBalance(
        admin.address
      );
      const contractBalance = await ethers.provider.getBalance(
        await eventDeposit.getAddress()
      );

      // Important: user3 (who never deposited) can trigger admin withdrawal
      await expect(eventDeposit.connect(user3).redeem())
        .to.emit(eventDeposit, "AdminWithdrawal")
        .withArgs(admin.address, contractBalance, (await time.latest()) + 1);

      const finalAdminBalance = await ethers.provider.getBalance(admin.address);
      expect(finalAdminBalance).to.equal(initialAdminBalance + contractBalance);

      // Contract should be empty
      const finalContractBalance = await ethers.provider.getBalance(
        await eventDeposit.getAddress()
      );
      expect(finalContractBalance).to.equal(0);
    });

    it("Should clear all deposits after admin withdrawal", async function () {
      // Trigger admin withdrawal by calling redeem after deadline
      await eventDeposit.connect(user1).redeem();

      // All users should no longer have deposits
      expect(await eventDeposit.hasDeposited(user1.address)).to.be.false;
      expect(await eventDeposit.hasDeposited(user2.address)).to.be.false;
    });

    it("Should fail if contract has no funds to withdraw", async function () {
      // First withdrawal should succeed
      await eventDeposit.connect(user1).redeem();

      // Second attempt should fail
      await expect(eventDeposit.connect(user2).redeem()).to.be.revertedWith(
        "No funds to withdraw"
      );
    });
  });

  describe("Edge Cases", function () {
    it("Should handle contract with no deposits after deadline", async function () {
      // Move past deadline without any deposits
      await time.increaseTo(REDEMPTION_DEADLINE + 1);

      await expect(eventDeposit.connect(user1).redeem()).to.be.revertedWith(
        "No funds to withdraw"
      );
    });

    it("Should allow checking deposit status", async function () {
      expect(await eventDeposit.hasDeposited(user1.address)).to.be.false;

      await eventDeposit.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      expect(await eventDeposit.hasDeposited(user1.address)).to.be.true;

      await eventDeposit.connect(user1).redeem();
      expect(await eventDeposit.hasDeposited(user1.address)).to.be.false;
    });
  });
});
