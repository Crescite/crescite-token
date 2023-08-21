import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { log } from './log';

/**
 * Writing a custom Chai matcher is tricky with Hardhat
 * so take the simpler route of a utility function that returns boolean.
 */
export function areWithinTolerance(a: BigNumber, b: BigNumber, tolerance = 0.000005) {
  const toleranceBigNumber = ethers.BigNumber.from(BigInt(tolerance * 1e18));
  const diff = a.sub(b).abs();

  const result = diff.lte(toleranceBigNumber);

  log(`\tDiff: ${diff.toString()}, Tolerance: ${toleranceBigNumber.toString()}`);
  
  if(!result) {
    console.error(`Expected ${a.toString()} to be within ${tolerance} of ${b.toString()}`);
  }

  return result;
}
