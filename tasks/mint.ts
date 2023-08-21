import { task } from 'hardhat/config';
import { bindToCrescite, formatEther, formatNumberString, getBalance, getTotalSupply, xdcAddressToEth } from '../util';

task('mint', 'Mint tokens')
  .addParam('account', 'the address of the account')
  .addParam('amount', 'the amount of tokens being minted to the address')
  .setAction(async ({ account, amount }, hre) => {
    const crescite = await bindToCrescite(hre);
    const amountWei = hre.ethers.utils.parseEther(amount);

    console.log(`Minting ${formatNumberString(amount)} tokens to account ${account}`);
    console.log('total supply before minting: ', formatNumberString(await getTotalSupply(crescite, hre)));
    console.log('balance of account before minting: ', formatNumberString(await getBalance(account, crescite, hre)));

    const tx = await crescite.mint(xdcAddressToEth(account), amountWei);
    const receipt = await tx.wait();

    console.log('gas used:', formatEther(receipt.gasUsed, hre));
    console.log('total supply after minting: ', formatNumberString(await getTotalSupply(crescite, hre)));
    console.log('balance of account after minting: ', formatNumberString(await getBalance(account, crescite, hre)));
  });
