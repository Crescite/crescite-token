import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
require("dotenv").config({ path: ".env" });

const XINFIN_NETWORK_URL = process.env.XINFIN_NETWORK_URL;
const XINFIN_PRIVATE_KEY = process.env.XINFIN_PRIVATE_KEY as string;

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

console.log("config:")
console.log(JSON.stringify(config));
console.log();

export default config;
