import chalk from 'chalk';
import { formatEther } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import prompts from 'prompts';
import { bindToCrescite, bindToStaking, logSymbol } from '../../util';

/**
 * This task should only be used in an emergency situation that requires
 * withdraw of all CRE from the staking contract in order to protect funds.
 *
 * It will:
 *
 * 1 - withdraw all CRE staked by users
 * 2 - also withdraw all CRE held in the staking contract for staking rewards
 *
 * The contract will only allow this to happen if the following conditions are true:
 *
 * 1 - The calling account is the contract owner
 * 2 - The staking contract is paused (use 'hh staking:pause')
 */
task(
  'staking:escape-hatch',
  'Withdraw all CRE from staking contract',
  async (taskArgs, hre) => {
    const provider = hre.ethers.provider;

    const staking = await bindToStaking(hre);
    const destinationAddress = await staking.viewEscapeHatchDestination();
    const crescite = await bindToCrescite(hre);

    console.log(
      chalk.red.bold(
        'This will withdraw all user-staked CRE and all CRE allocated for staking rewards!',
      ),
    );

    console.log('\nNetwork:', chalk.yellow(hre.network.name));
    console.log('Staking contract:', chalk.yellow(staking.address));
    console.log(
      'Staking contract balance:',
      chalk.yellow(`${await crescite.balanceOf(staking.address)}`),
    );

    console.log(
      'Number of stakers:',
      chalk.yellow(`${await staking.viewNumberOfStakers()}`),
    );

    console.log('Total staked:', chalk.yellow(`${await staking.totalStaked()}`));
    console.log('\nYou are transacting from:', chalk.green(destinationAddress));
    console.log(
      'Gas available:',
      chalk.green(formatEther(await provider.getBalance(destinationAddress))),
    );

    console.log('Withdraw destination:', chalk.red(destinationAddress));

    /**
     *
     */
    async function requestConfirmation() {
      console.log('\n');

      const response = await prompts([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Withdraw user-staked CRE and the staking rewards CRE?',
        },
        {
          type: 'text',
          name: 'sure',
          message: 'Type "withdraw" to confirm.',
        },
      ]);

      return response?.confirm === true && response?.sure === 'withdraw';
    }

    if (await requestConfirmation()) {
      const tx = await staking.escapeHatch({
        gasLimit: 100_000,
      });

      const receipt = await tx.wait();

      const newContractBalance = await crescite.balanceOf(staking.address);
      const newAccountBalance = await crescite.balanceOf(destinationAddress);

      console.log(
        `\n- CRE successfully transferred from ${chalk.yellow(
          staking.address,
        )} to ${chalk.yellow(destinationAddress)}`,
      );
      console.log('- txId:', chalk.yellow(receipt.transactionHash));
      console.log(
        '- Staking contract CRE balance is now:',
        chalk.yellow(newContractBalance),
      );
      console.log(
        `- ${destinationAddress} CRE balance is now:`,
        chalk.yellow(newAccountBalance),
      );
      console.log(logSymbol.success, chalk.green('Done'));
    } else {
      console.log('Cancelled, no tokens transferred.');
    }
  },
);
