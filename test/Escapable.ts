// Crescite token address
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { Crescite, EscapableHarness } from '../typechain-types';
import { HARDHAT_TOKEN_CONTRACT } from '../util';
import { big } from './util/big';

async function deployFixtures() {
  const tokenAddress = HARDHAT_TOKEN_CONTRACT;
  const [owner] = await ethers.getSigners();

  const crescite = (await ethers.deployContract('Crescite')) as Crescite;

  const escapable = (await ethers.deployContract('EscapableHarness')) as EscapableHarness;
  await escapable.initialize(tokenAddress, owner.address, owner.address);

  return { crescite, escapable, owner };
}

describe('Escapable', () => {
  before(async function () {
    await network.provider.send('hardhat_reset');
  });

  it('should send contract tokens to escape hatch address', async () => {
    const { crescite, escapable, owner } = await loadFixture(deployFixtures);
    await crescite.connect(owner).mint(escapable.address, big(1000));

    await expect(escapable.escapeHatch()).not.to.be.reverted;
    await expect(crescite.balanceOf(owner.address)).to.eventually.eq(big(1000));
    await expect(crescite.balanceOf(escapable.address)).to.eventually.eq(0);
  });

  it('should emit EscapeHatchCalled event', async () => {
    const { crescite, escapable, owner } = await loadFixture(deployFixtures);
    await crescite.connect(owner).mint(escapable.address, big(1000));

    await expect(escapable.escapeHatch())
      .to.emit(escapable, 'EscapeHatchCalled')
      .withArgs(big(1000));
  });

  it('should revert if signer not set as escape hatch caller', async () => {
    const [owner, otherAccount] = await ethers.getSigners();

    const { crescite, escapable } = await loadFixture(deployFixtures);
    await crescite.connect(owner).mint(escapable.address, big(1000));

    await expect(escapable.connect(otherAccount).escapeHatch()).to.be.revertedWith(
      'Escapable: not permitted',
    );
  });

  it('should reject ETH payments when ERC20 token address being used', async () => {
    const { escapable, owner } = await loadFixture(deployFixtures);

    await expect(
      owner.sendTransaction({
        to: escapable.address,
        value: ethers.utils.parseEther('1.0'),
      }),
    ).to.be.revertedWith('Escapable: Cannot receive ETH when baseToken is ERC20');
  });

  it('should change escape hatch caller and emit EscapeHatchCallerChanged event', async () => {
    const [originalCaller, newCaller] = await ethers.getSigners();
    const { escapable } = await loadFixture(deployFixtures);

    await expect(escapable.changeEscapeHatchCaller(newCaller.address))
      .to.emit(escapable, 'EscapeHatchCallerChanged')
      .withArgs(newCaller.address);

    // try to call escape hatch with originally set caller, should reject
    await expect(escapable.connect(originalCaller).escapeHatch()).to.be.revertedWith(
      'Escapable: not permitted',
    );

    // but should permit with new escape hatch caller
    await expect(escapable.connect(newCaller).escapeHatch()).not.to.be.revertedWith(
      'Escapable: not permitted',
    );
  });

  it('should deny change of escape hatch caller to non-owner', async () => {
    const [owner, otherAccount] = await ethers.getSigners();
    const { escapable } = await loadFixture(deployFixtures);

    // try to call escape hatch with originally set caller, should reject
    await expect(
      escapable.connect(otherAccount).changeEscapeHatchCaller(otherAccount.address),
    ).to.be.revertedWith('Escapable: not permitted');
  });
});
