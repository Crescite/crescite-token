import chalk from 'chalk';
import { task } from 'hardhat/config';

task(
  "goldtoken:test",
  "Prints the current block number",
  async (_, { ethers }) => {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("Current block number: " + blockNumber);
  }
);