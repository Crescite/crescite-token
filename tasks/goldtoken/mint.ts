import chalk from 'chalk';
import { task } from 'hardhat/config';
import {
  bindToGoldToken,
  formatEther,
  formatNumberString,
  getBalance,
  getTotalSupply,
  logSymbol,
  xdcAddressToEth,
} from '../../util';

task('goldtoken:mint', 'Mint gold tokens')
  .addParam('account', 'the address of the account who has the role to mint')
  .addParam('amount', 'the amount of tokens being minted to the address')
  .setAction(async ({ account, amount }, hre) => {
    const goldToken = await bindToGoldToken(hre);
    const amountWei = hre.ethers.utils.parseEther(amount);

    console.log(
      chalk.bold(`Minting ${formatNumberString(amount)} gold tokens to account ${account}`),
    );
    console.log(
      '- total supply before minting: ',
      formatNumberString(await getTotalSupply(goldToken, hre)),
    );
    console.log(
      '- balance of account before minting: ',
      formatNumberString(await getBalance(account, goldToken, hre)),
    );

    const tx = await goldToken.mint(xdcAddressToEth(account), amountWei);
    const receipt = await tx.wait();

    console.log(
      logSymbol.success,
      'gas used:',
      chalk.green(formatEther(receipt.gasUsed, hre)),
    );
    console.log(
      logSymbol.success,
      'total supply after minting: ',
      chalk.green(formatNumberString(await getTotalSupply(goldToken, hre))),
    );
    console.log(
      logSymbol.success,
      'balance of account after minting: ',
      chalk.green(formatNumberString(await getBalance(account, goldToken, hre))),
    );
  });
