import { ethers, upgrades } from 'hardhat';
import { HARDHAT_ACCOUNT_1, HARDHAT_TOKEN_CONTRACT } from '../util';

describe('Staking_V1', function () {
  let proxyAddress: string;

  it('deploys', async function () {
    const escapeHatchDestination = HARDHAT_ACCOUNT_1;
    const contract = await ethers.getContractFactory('Staking_V1');
    const { address } = await upgrades.deployProxy(
      contract,
      [HARDHAT_TOKEN_CONTRACT, 12, escapeHatchDestination],
      {
        kind: 'uups',
      },
    );

    proxyAddress = address;
  });

  it('should grant DEFAULT_ADMIN_ROLE to deploying account', () => {});
  it('should grant ESCAPE_CALLER_ROLE to deploying account', () => {});
  it('should only permit account with ESCAPE_CALLER_ROLE to call escapeHatch()', () => {});

  /**
   * Uncomment this once Staking_V2 is ready to go if needed
   * proxyAddress contains address of the proxy to upgrade
   */
  // it.skip('upgrades', async () => {
  //   const Staking_V2 = await ethers.getContractFactory('Staking_V2');
  //   const { address } = await upgrades.upgradeProxy(proxyAddress, Staking_V2);
  //   proxyAddress = address;
  //
  //   const contract = (await ethers.getContractAt('Staking_V2', address)) as Staking_V2;
  //   await contract.initializeV2(HARDHAT_TOKEN_CONTRACT, 12);
  // });
});
