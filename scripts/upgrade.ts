import { ethers, upgrades } from 'hardhat';
require("dotenv").config({ path: ".env" });

const CRESCITE_CONTRACT_ADDRESS = getContractAddress()

function getContractAddress() {
    if (process.env.CRESCITE_CONTRACT_ADDRESS) {
        return process.env.CRESCITE_CONTRACT_ADDRESS
    } else {
        throw new Error("I cannot upgrade because I couldn't fine CRESCITE_ADDRESS defined in the .env file")
    }
}

async function main() {
  await upgradeCrescite();
}

async function upgradeCrescite() {
  const Crescite = await ethers.getContractFactory("Crescite");
  const crescite = await upgrades.upgradeProxy(CRESCITE_CONTRACT_ADDRESS, Crescite);
  await crescite.deployed();
  console.log("Crescite contract upgrade", crescite.address);
}

// Call the main function and catch if there is any error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });