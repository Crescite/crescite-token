import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Staking } from '../typechain-types';
import { getStakingContractAddress } from './get-staking-contract-address';
import { xdcAddressToEth } from './xdc-address-to-eth';

export async function bindToStaking(hre: HardhatRuntimeEnvironment): Promise<Staking> {
  const stakingContractAddress = getStakingContractAddress(hre);

  const StakingFactory = await hre.ethers.getContractFactory('Staking');
  const staking = StakingFactory.attach(xdcAddressToEth(stakingContractAddress));
  return staking;
}
