import { task } from 'hardhat/config';
import { bindToCrescite, xdcAddressToEth } from '../util';

task('revoke-role', 'Remove an account from a role')
  .addParam('account', 'XDC account')
  .addParam('role', 'one of the supported roles: DEFAULT_ADMIN_ROLE, SNAPSHOT_ROLE, PAUSER_ROLE, MINTER_ROLE')
  .setAction(async ({ role, account }, hre) => {
    const crescite = await bindToCrescite(hre);
    const address = xdcAddressToEth(account);

    const roleBinary = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));
    const grantRoleTx = await crescite.revokeRole(roleBinary, address);
    await grantRoleTx.wait();

    console.log(`Role ${role} has been revoked from account ${account}`);
  });
