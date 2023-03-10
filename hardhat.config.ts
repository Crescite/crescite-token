import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import { HardhatRuntimeEnvironment } from "hardhat/types";
require("dotenv").config({ path: ".env" });
import { Crescite } from './typechain-types/contracts/Crescite';
import { BigNumberish } from "ethers";

const XINFIN_NETWORK_URL = process.env.XINFIN_NETWORK_URL as string;
const XINFIN_PRIVATE_KEY = process.env.XINFIN_PRIVATE_KEY as string;
const TOKEN_CONTRACT = process.env.TOKEN_CONTRACT as string;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    }
  },
  networks: {
    xinfin: {
      url: XINFIN_NETWORK_URL,
      accounts: [XINFIN_PRIVATE_KEY],
    },
  },
};

export default config;

task("print-config", "Prints the config", async (taskArgs, hre) => {
  console.log("config:")
  console.log(JSON.stringify(config));
  console.log();
});

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deploy", "Deploys the contract", async (taskArgs, hre) => {
  const Crescite = await hre.ethers.getContractFactory("Crescite");
  const crescite = await Crescite.deploy();
  await crescite.deployed();
  console.log(crescite.address);
});

task("total-supply", "Prints out the total supply of the token", async (taskArgs, hre) => {
  const crescite = await bindToCrescite(hre);
  console.log(formatNumberString(await getTotalSupply(crescite, hre)));
})

task("balance", "Get balance of account")
.addParam("account", "the address of the account")
.setAction(async ({account}, hre) => {
  const crescite = await bindToCrescite(hre);
  const balance = await getBalance(account, crescite, hre);
  console.log(formatNumberString(balance));
});

task("mint", "Mint tokens")
.addParam("account", "the address of the account")
.addParam("amount", "the amount of tokens being minted to the address")
.setAction(async ({account, amount}, hre) => {
  const crescite = await bindToCrescite(hre);
  console.log(`Minting ${formatNumberString(amount)} tokens to account ${account}`);
  const amountWei = hre.ethers.utils.parseEther(amount);
  console.log("total supply before minting: ", formatNumberString(await getTotalSupply(crescite, hre)));
  console.log("balance of account before minting: ", formatNumberString(await getBalance(account, crescite, hre)));
  const tx = await crescite.mint(xdcAddressToEth(account), amountWei);
  const receipt = await tx.wait();
  console.log('gas used:', formatEther(receipt.gasUsed, hre));
  console.log("total supply after minting: ", formatNumberString(await getTotalSupply(crescite, hre)));
  console.log("balance of account after minting: ", formatNumberString(await getBalance(account, crescite, hre)));
});

task("burn", "Burn tokens in the issuing account")
.addParam("amount", "the amount of tokens in the issuing account that will be burnt")
.setAction(async ({amount}, hre) => {
  const crescite = await bindToCrescite(hre);
  const account = ethAddressToXdc(await (await hre.ethers.getSigners())[0].getAddress());
  console.log(`Burning ${formatNumberString(amount)} tokens from issuing account ${account}`);
  const amountWei = hre.ethers.utils.parseEther(amount);
  console.log("total supply before burning: ", formatNumberString(await getTotalSupply(crescite, hre)));
  console.log("balance of account before burning: ", formatNumberString(await getBalance(account, crescite, hre)));
  const tx = await crescite.burn(amountWei);
  const receipt = await tx.wait();
  console.log('gas used:', formatEther(receipt.gasUsed, hre));
  console.log("total supply after minting: ", formatNumberString(await getTotalSupply(crescite, hre)));
  console.log("balance of account after minting: ", formatNumberString(await getBalance(account, crescite, hre)));
});

task("has-role", "Determine if an acount has a role")
.addParam("role", "one of the supported roles: DEFAULT_ADMIN_ROLE, SNAPSHOT_ROLE, PAUSER_ROLE, MINTER_ROLE")
.addParam("account", "XDC account ")
.setAction(async ({role, account}, hre) => {
  const crescite = await bindToCrescite(hre);
  const address = xdcAddressToEth(account);
  const roleBinary = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));
  const hasRole = await crescite.hasRole(roleBinary, address);
  if (hasRole) {
    console.log(`account ${account} has the role ${role}`);
  } else {
    console.log(`account ${account} does not have the role ${role}`);
  }
});

task("grant-role", "Add an account to a role")
.addParam("account", "XDC account")
.addParam("role", "one of the supported roles: DEFAULT_ADMIN_ROLE, SNAPSHOT_ROLE, PAUSER_ROLE, MINTER_ROLE")
.setAction(async ({role, account}, hre) => {
  const crescite = await bindToCrescite(hre);
  const address = xdcAddressToEth(account);
  const roleBinary = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));
  const grantRoletx = await crescite.grantRole(roleBinary, address);
  await grantRoletx.wait();
  console.log(`Role ${role} granted to ${account}`);
});

task("revoke-role", "Remove an account from a role")
.addParam("account", "XDC account")
.addParam("role", "one of the supported roles: DEFAULT_ADMIN_ROLE, SNAPSHOT_ROLE, PAUSER_ROLE, MINTER_ROLE")
.setAction(async ({role, account}, hre) => {
  const crescite = await bindToCrescite(hre);
  const address = xdcAddressToEth(account);
  const roleBinary = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));
  const grantRoletx = await crescite.revokeRole(roleBinary, address);
  await grantRoletx.wait();
  console.log(`Role ${role} has been revoked from account ${account}`);
});

// -- Utility functions

function formatNumberString(numberAsString: string): string {
  return parseFloat(numberAsString).toLocaleString();
}

async function bindToCrescite(hre: HardhatRuntimeEnvironment): Promise<Crescite> {
  const CresciteFactory = await hre.ethers.getContractFactory("Crescite");
  const crescite = CresciteFactory.attach(xdcAddressToEth(TOKEN_CONTRACT));
  return crescite;
}

async function getTotalSupply(crescite: Crescite, hre: HardhatRuntimeEnvironment): Promise<string> {
  const totalSupply = await crescite.totalSupply()
  return formatEther(totalSupply, hre);
}

async function getBalance(account: string, crescite: Crescite, hre: HardhatRuntimeEnvironment): Promise<string> {
  const balance = await crescite.balanceOf(xdcAddressToEth(account));
  return formatEther(balance, hre);
}

function formatEther(amount: BigNumberish, hre: HardhatRuntimeEnvironment): string {
  return hre.ethers.utils.formatEther(amount);
}

function xdcAddressToEth(address: string): string {
  if (address.startsWith('0x')) {
    return address;
  }
  if (address.startsWith('xdc')) {
    return '0x' + address.slice(3);
  }
  throw new Error(`unknown address type ${address}`);
}

function ethAddressToXdc(address: string): string {
  if (address.startsWith('xdc')) {
    return address;
  }
  if (address.startsWith('0x')) {
    return 'xdc' + address.slice(2);
  }
  throw new Error(`unknown address type: ${address}`);
}