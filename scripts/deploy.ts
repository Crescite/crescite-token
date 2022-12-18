import { ethers, upgrades } from 'hardhat';

async function main() {
  await deployCrescite();
}

async function deployCrescite() {
  const Crescite = await ethers.getContractFactory("Crescite");
  const crescite = await Crescite.deploy();
  await crescite.deployed();
  console.log("Crescite contract address:", crescite.address);
}

// Call the main function and catch if there is any error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });