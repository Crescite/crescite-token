import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { CommodityBroker, CommodityToken, USDC_Mock, GoldToken } from '../typechain-types';
import { big } from './util/big';

  //  admin.address
  // '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  // treasuryWallet.address
  // '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  // user.address
  // '0x35D8DAe5215aA7a53D27a8227C0774e67795f53F'


async function deployFixtures() {
  const [admin, treasuryWallet, user ] = await ethers.getSigners();

  // ... deployment logic ...
  const goldToken = (await ethers.deployContract('GoldToken', admin)) as GoldToken;
  await goldToken.deployed();
  const usdcToken = (await ethers.deployContract('USDC_Mock', treasuryWallet)) as USDC_Mock;
  await usdcToken.deployed();

  // Mint a sufficient amount of XAUC to the treasury wallet
  await goldToken.connect(admin).mint(treasuryWallet.address, big(1_000)); // Adjust this amount as needed
  // Give sufficient USDC to the user wallet
  await usdcToken.connect(treasuryWallet).mint(user.address, big(64_640));

  // Deploy CommodityBroker
  const CommodityBrokerFactory = await ethers.getContractFactory("CommodityBroker");
  const commodityBroker = (await CommodityBrokerFactory.deploy(treasuryWallet.address, goldToken.address, usdcToken.address, big(64), big(0.01))) as CommodityBroker;
  // const commodityBroker = (await ethers.deployContract('CommodityBroker', admin)) as CommodityBroker;
  await commodityBroker.deployed();
  // await commodityBroker.connect(admin).setRateAndSpread(big(64), big(0.01)); // 100 XAUC per USDC, 100 bps spread


  
  return { admin, user, treasuryWallet, usdcToken, goldToken, commodityBroker };
}

describe("CommodityBroker Contract", function () {
  it("should allow purchase at correct rate", async function () {
    const { admin, user, treasuryWallet, usdcToken, goldToken, commodityBroker } = await loadFixture(deployFixtures);


    expect(goldToken.allowance(treasuryWallet.address, admin.address)).eventually.to.equal(0);

    await usdcToken.connect(user).approve(commodityBroker.address, big(10_000));
    await goldToken.connect(treasuryWallet).approve(commodityBroker.address, big(10_000));

    const xaucAmount = big(1); // 1 XAUC
    const rate = await commodityBroker.getAsk();

    expect(rate).to.equal(big(64.64))

    // Check balances
    expect(await goldToken.balanceOf(user.address)).to.equal(0);
    expect(await usdcToken.balanceOf(treasuryWallet.address)).to.equal(0);
    expect(await goldToken.balanceOf(treasuryWallet.address)).to.equal(big(1000));
    expect(await usdcToken.balanceOf(user.address)).to.equal(big(64640));

    await commodityBroker.connect(user).purchase(xaucAmount, rate);

    // Check balances
    expect(await goldToken.balanceOf(user.address)).to.equal(xaucAmount);
    expect(await usdcToken.balanceOf(treasuryWallet.address)).to.equal(big(64.64));
    expect(await goldToken.balanceOf(treasuryWallet.address)).to.equal(big(999));
    expect(await usdcToken.balanceOf(user.address)).to.equal(big(64575.36));

  });

  it("should revert purchase at incorrect rate", async function () {
    const { admin, user, treasuryWallet, usdcToken, goldToken, commodityBroker } = await loadFixture(deployFixtures);
    const xaucAmount = ethers.utils.parseEther("1"); // 1 XAUC
    const incorrectRate = (await commodityBroker.getAsk()).add(1); // Incorrect rate

    await expect(commodityBroker.connect(user).purchase(xaucAmount, incorrectRate)).to.be.revertedWith("Incorrect rate provided");
  });

  it("should revert if treasury didn't give enough approval to CommoditiesContract to spend its XAUC", async function () {
    const { admin, user, treasuryWallet, usdcToken, goldToken, commodityBroker } = await loadFixture(deployFixtures);
    const xaucAmount = big(1);
    const rate = await commodityBroker.getAsk();

    await expect(commodityBroker.connect(user).purchase(xaucAmount, rate)).
            to.be.revertedWith("Not enough allowance of XAUC in " +
            treasuryWallet.address.toLowerCase() +
            " wallet for spender=" +
            commodityBroker.address.toLowerCase() +
            ": available=0, required=1000000000000000000");
  });

  it("should revert if treasury does not have enough XAUC", async function () {
    const { admin, user, treasuryWallet, usdcToken, goldToken, commodityBroker } = await loadFixture(deployFixtures);
    const xaucAmount = big(1001); // More than treasury has
    const rate = await commodityBroker.getAsk();

    expect(commodityBroker.connect(user).purchase(xaucAmount, rate)).
            eventually.rejectedWith("Not enough XAUC in " +
            treasuryWallet.address.toLowerCase() +
            " wallet: available=1000000000000000000000, required=1001000000000000000000");
  });
  it("should revert if user does not have enough USDC", async function () {
    const { user, commodityBroker, goldToken, usdcToken, treasuryWallet, admin } = await loadFixture(deployFixtures);
    await goldToken.connect(admin).mint(treasuryWallet.address, big(3000));
    const xaucAmount = big(4000);
    expect(await goldToken.balanceOf(treasuryWallet.address)).to.equal(xaucAmount);
    expect(await usdcToken.balanceOf(user.address)).to.equal(big(64640));

    const rate = await commodityBroker.getAsk();
    // Approve an "infinite" amount of XAUC tokens
    await goldToken.connect(treasuryWallet).approve(commodityBroker.address, ethers.constants.MaxUint256);


    // Assuming user has less USDC than required
    await expect(commodityBroker.connect(user).purchase(xaucAmount, rate))
        .to.be.revertedWith("Not enough USDC in " +
            user.address.toLowerCase() +
            " wallet: available=" +
            big(64640) +
            ", required=" +
            big(64.64 * 4000));

    expect(await goldToken.balanceOf(treasuryWallet.address)).to.equal(xaucAmount);
    expect(await usdcToken.balanceOf(user.address)).to.equal(big(64640));
  });

  it("should revert if user has not approved enough USDC", async function () {
      const { user, usdcToken, commodityBroker, goldToken, treasuryWallet } = await loadFixture(deployFixtures);
      const xaucAmount = big(1);
      const rate = await commodityBroker.getAsk();
      // Approve an "infinite" amount of XAUC tokens
      await goldToken.connect(treasuryWallet).approve(commodityBroker.address, ethers.constants.MaxUint256);

      // User approves less than required
      await usdcToken.connect(user).approve(commodityBroker.address, big(63.64));

      const allowance = await usdcToken.allowance(user.address, commodityBroker.address);
      expect(allowance).to.equal(big(63.64));

      await expect(commodityBroker.connect(user).purchase(xaucAmount, rate))
          .to.be.revertedWith("Not enough allowance of USDC in " +
              user.address.toLowerCase() +
              " wallet for spender=" + 
              commodityBroker.address.toLowerCase() +
              ": available=" +
              big(63.64) +
              ", required=" +
              big(64.64)
              );
  });


  it("should revert setting rate and spread by non-admin", async function () {
    const { user, commodityBroker } = await loadFixture(deployFixtures);
    
    await expect(commodityBroker.connect(user).setRateAndSpread(big(50), big(0.02)))
        .to.be.revertedWith("Caller is not an admin");
  });

  it("should revert changing treasury wallet by non-admin", async function () {
    const { user, commodityBroker } = await loadFixture(deployFixtures);
    const newTreasuryWallet = user.address; // Example new address

    await expect(commodityBroker.connect(user).setTreasuryWalletAddress(newTreasuryWallet))
        .to.be.revertedWith("Caller is not an admin");
  });

  it("should revert purchasing with zero amount", async function () {
    const { user, commodityBroker } = await loadFixture(deployFixtures);
    const rate = await commodityBroker.getAsk();

    await expect(commodityBroker.connect(user).purchase(big(0), rate))
        .to.be.revertedWith("Purchase amount must be greater than zero");
  });

});
