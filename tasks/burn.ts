import { task } from 'hardhat/config';
import { bindToCrescite, ethAddressToXdc, formatEther, formatNumberString, getBalance, getTotalSupply } from '../util';

task('burn', 'Burn tokens in the issuing account')
  .addParam('amount', 'the amount of tokens in the issuing account that will be burnt')
  .setAction(async ({ amount }, hre) => {
    const crescite = await bindToCrescite(hre);
    const account = ethAddressToXdc(await (await hre.ethers.getSigners())[0].getAddress());
    console.log(`Burning ${formatNumberString(amount)} tokens from issuing account ${account}`);
    const amountWei = hre.ethers.utils.parseEther(amount);

    console.log('total supply before burning: ', formatNumberString(await getTotalSupply(crescite, hre)));
    console.log('balance of account before burning: ', formatNumberString(await getBalance(account, crescite, hre)));

    const tx = await crescite.burn(amountWei);
    const receipt = await tx.wait();

    console.log('gas used:', formatEther(receipt.gasUsed, hre));
    console.log('total supply after minting: ', formatNumberString(await getTotalSupply(crescite, hre)));
    console.log('balance of account after minting: ', formatNumberString(await getBalance(account, crescite, hre)));
  });
