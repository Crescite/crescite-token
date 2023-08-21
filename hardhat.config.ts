import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import { HardhatUserConfig } from 'hardhat/config';
import { getHardhatUserConfig } from './util';

/**
 * Plugins
 */
require('hardhat-ethernal');

/**
 * Tasks
 */
import './tasks';

/**
 * Config
 */
const config: HardhatUserConfig & { ethernal: any } = getHardhatUserConfig();

export default config;

