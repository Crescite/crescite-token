import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { CommodityBroker, CommodityToken, USDC_Mock, GoldToken } from '../typechain-types';
import { big } from './util/big';

async function deployFixtures() {
  const [admin, treasuryWallet, user ] = await ethers.getSigners();
  // ... deployment logic ...
  const goldToken = (await ethers.deployContract('GoldToken', admin)) as GoldToken;
  await goldToken.deployed();
  const usdcToken = (await ethers.deployContract('USDC_Mock', treasuryWallet)) as USDC_Mock;
  await usdcToken.deployed();

  // Mint a sufficient amount of XAUC to the treasury wallet
  const mintAmount = big(100_000_000); // Adjust this amount as needed
  await goldToken.connect(admin).mint(treasuryWallet.address, mintAmount);
  // Give sufficient USDC to the user wallet
  await usdcToken.connect(treasuryWallet).mint(user.address, big(100_000_000));

  // Deploy CommodityBroker
  const CommodityBrokerFactory = await ethers.getContractFactory("CommodityBroker");
  const commodityBroker = (await CommodityBrokerFactory.deploy(treasuryWallet.address, goldToken.address, usdcToken.address)) as CommodityBroker;
  // const commodityBroker = (await ethers.deployContract('CommodityBroker', admin)) as CommodityBroker;
  await commodityBroker.deployed();

  
  return { admin, user, treasuryWallet, usdcToken, goldToken, commodityBroker };
}

describe("CommodityBroker Contract", function () {
  it("should allow purchase at correct rate", async function () {
    const { admin, user, treasuryWallet, usdcToken, goldToken, commodityBroker } = await loadFixture(deployFixtures);


    expect(goldToken.allowance(treasuryWallet.address, admin.address)).eventually.to.equal(0);

    await commodityBroker.connect(admin).setRateAndSpread(big(64), big(0.01)); // 100 XAUC per USDC, 100 bps spread
    await usdcToken.connect(user).approve(commodityBroker.address, big(10_000));
    await goldToken.connect(treasuryWallet).approve(commodityBroker.address, big(10_000));

    const xaucAmount = big(1); // 1 XAUC
    const rate = await commodityBroker.getAsk();

    expect(rate).to.equal(big(64.64))

    // Check balances
    expect(await goldToken.balanceOf(user.address)).to.equal(0);
    expect(await usdcToken.balanceOf(treasuryWallet.address)).to.equal(0);

    await commodityBroker.connect(user).purchase(xaucAmount, rate);

    // Check balances
    expect(await goldToken.balanceOf(user.address)).to.equal(xaucAmount);
    expect(await usdcToken.balanceOf(treasuryWallet.address)).to.equal(big(64.64));

  });

  // ... Other tests ...
});
