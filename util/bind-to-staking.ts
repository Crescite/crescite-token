import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getStakingContractAddress } from './get-staking-contract-address';
import { xdcAddressToEth } from './xdc-address-to-eth';

// TODO handle different versions of staking contract
export async function bindToStaking(hre: HardhatRuntimeEnvironment) {
  const stakingContractAddress = getStakingContractAddress(hre);

  const StakingFactory = await hre.ethers.getContractFactory(`Staking_V1`);
  const staking = StakingFactory.attach(xdcAddressToEth(stakingContractAddress));

  return staking;
}
