import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';

/**
 * Plugins
 */
import 'hardhat-abi-exporter';
import 'hardhat-ethernal';
import { HardhatUserConfig } from 'hardhat/config';

/**
 * Tasks
 */
import './tasks';
import { getHardhatUserConfig } from './util';

/**
 * Config
 */
const config: HardhatUserConfig = getHardhatUserConfig();

export default config;

