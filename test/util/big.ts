import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

export function big(intValue: number): BigNumber {
  return ethers.utils.parseEther(String(intValue));
}
