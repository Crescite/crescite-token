import { task } from 'hardhat/config';
import { bindToCrescite, xdcAddressToEth } from '../../util';

task('has-role', 'Determine if an account has a role')
  .addParam(
    'role',
    'one of the supported roles: DEFAULT_ADMIN_ROLE, SNAPSHOT_ROLE, PAUSER_ROLE, MINTER_ROLE',
  )
  .addParam('account', 'XDC account ')
  .setAction(async ({ role, account }, hre) => {
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
