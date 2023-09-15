import chalk from 'chalk';
import { task } from 'hardhat/config';
import {
  bindToCrescite,
  formatEther,
  formatNumberString,
  getBalance,
  getTotalSupply,
  logSymbol,
  xdcAddressToEth,
} from '../../util';

task('mint', 'Mint tokens')
  .addParam('account', 'the address of the account')
  .addParam('amount', 'the amount of tokens being minted to the address')
  .setAction(async ({ account, amount }, hre) => {
    const crescite = await bindToCrescite(hre);
    const amountWei = hre.ethers.utils.parseEther(amount);

    console.log(
      chalk.bold(`Minting ${formatNumberString(amount)} tokens to account ${account}`),
    );
    console.log(
      '- total supply before minting: ',
      formatNumberString(await getTotalSupply(crescite, hre)),
    );
    console.log(
      '- balance of account before minting: ',
      formatNumberString(await getBalance(account, crescite, hre)),
    );

    const tx = await crescite.mint(xdcAddressToEth(account), amountWei);
    const receipt = await tx.wait();

    console.log(
      logSymbol.success,
      'gas used:',
      chalk.green(formatEther(receipt.gasUsed, hre)),
    );
    console.log(
      logSymbol.success,
      'total supply after minting: ',
      chalk.green(formatNumberString(await getTotalSupply(crescite, hre))),
    );
    console.log(
      logSymbol.success,
      'balance of account after minting: ',
      chalk.green(formatNumberString(await getBalance(account, crescite, hre))),
    );
  });
