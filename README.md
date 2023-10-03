![Crescite Logo](./img/Crescite%20logo_transparent%20GOLD%20BROWN_cropped.png)

# Crescite smart contracts

This is the repository for the [Crescite](https://crescite.org/) Token.
Token
Tracker: [xdcb5fa33923ec3ff7f4b9ab7b4c20b236d31243f77](https://explorer.xinfin.network/tokens/xdcb5fa33923ec3ff7f4b9ab7b4c20b236d31243f77)

## Crescite

The Crescite token uses industry standard, audited base contracts from [Open Zeppelin](https://www.openzeppelin.com/).
The token contract supports the following set of base interfaces:

- [Role-based](https://docs.openzeppelin.com/contracts/4.x/access-control#granting-and-revoking) [AccessControl](https://docs.openzeppelin.com/contracts/4.x/api/access)
- [ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20)
- [Mintable](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_mint-address-uint256-)
- [Burnable](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_burn-address-uint256-)
- [Pausable](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Pausable)
- [Snapshot](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Snapshot)
- [Permit](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Permit)
- [Flash Minting](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20FlashMint)

## Staking

The staking contract allows CRE holders to stake tokens and receieve rewards accrued per second at a fixed APR rate.

It uses the following math library for arithmetic operations:

- [DSMath](https://github.com/dapphub/ds-math)

It also uses Open Zeppelin base contracts.

- [Context](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Context.sol)
- [ReentrancyGuard](https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard)
- [Ownable](https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable)
- [Pausable](https://docs.openzeppelin.com/contracts/4.x/api/security#Pausable)

### Constructor parameters

- CRE token address
- APR (e.g. 12)

## License

Crescite is published under the [Apache v2.0](./LICENSE.md) license.

---

# Install

Then run the following to install all dependencies.

    npm install --legacy-peer-deps

Ethernal has some problematic peer dependencies which is why `--legacy-peer-deps` is required.

Install the Hardhat shortcut:

    npm install --global hardhat-shorthand

# Environment

See `.env-example` for guidance on environment config vars.

---

# Development

Local dev stack consists of:

- Hardhat
- Ethernal

## Accounts

Multiple accounts are configured locally to aid with simulating use of the staking feature by multiple users.

### Local accounts

- Hardhat account 1 (corresponds to Hardhat's default address #1)
- Hardhat account 2 (corresponds to Hardhat's default address #2)
- Optional third account (arbitrary address)

### Apothem Network

```
APOTHEM_NETWORK_URL=https://erpc.apothem.network
APOTHEM_PRIVATE_KEY=[the private ket for deploying to the Apothem network]
APOTHEM_TOKEN_CONTRACT=[address of CRE token contract the staking contract should use]
APOTHEM_STAKING_CONTRACT=[address of latest staking contract version]
```

### XDC Mainnet

First though ensure your `.env` file is setup on the repo root folder.

In the local directory of this project setup `.env` file with the following content:

```
XINFIN_NETWORK_URL=https://erpc.xinfin.network
XINFIN_PRIVATE_KEY=[the private key for deploying to the XDC network]
XINFIN_TOKEN_CONTRACT=[address of CRE token contract the staking contract should use]
XINFIN_STAKING_CONTRACT=[address of latest staking contract version]
```

## Run unit tests

    npm run test

## Running Hardhat node

    hh node

## Ethernal

[Ethernal](https://app.tryethernal.com) is a block explorer that can sync with the Hardhat node.
It runs remotely and syncs via the [`hardhat-ethernal`](https://github.com/tryethernal/hardhat-ethernal) plugin.

Very useful for local development. You can list tokens, contracts, view transactions etc.

### Install

    npm i -g ethernal

### Create an Ethernal account

To create an account go to https://app.tryethernal.com.

Once your account is created you must also create a workspace. Then add the workpace name to your `.env` file:

    ETHERNAL_WORKSPACE=[NAME]

The workspace syncs with the local Hardhat node via the `hardhat-ethernal` plugin.

### Login to Ethernal at the CLI

If you install ethernal globally you can run:

    ethernal login

### Running Ethernal

Ethernal is accessed via the URL https://app.tryethernal.com, no binaries need to be
run and Hardhat is configured to push changes to Ethernal automatically.

### Ethernal and unit tests

Ethernal is disabled when running unit tests.

### Workspace auto-reset

Your ethernal workspace will be reset each time you run the Hardhat node.
This means accounts, balances and smart contracts will all be reset.

To change this edit the `ethernal` options slice of the Hardhat config located at`util/get-hardhat-user-config.ts`.

### Manually push contract changes to ethernal

    hh ethernal-push

## Fixtures

Deploy contracts and mint some tokens.

### Auto

This command performs the following:

1. Deploys both `Crescite` and `Staking` contracts to the Hardhat node
2. Mints CRE to local accounts as well as minting rewards tokens to the staking contract address so it can supply rewards. 
3. Sync contract artifacts to Ethernal for introspection

        hh dev:init

### Manual

After each command the deployed address will be output to `stdout` for copying.

#### Step 1 - Deploy Crescite token contract

    hh crescite:deploy

#### Step 2 - Deploy Staking V1 contract

Specify the token to stake (Crescite) and the staking APR (%):

    // e.g. Crescite is deployed to 0x5FbDB2315678afecb367f032d93F642f64180aa3
    hh staking:deploy:v1 --token-address 0x5FbDB2315678afecb367f032d93F642f64180aa3 --apr 12

#### Step 3 - Mint token rewards to staking contract

The staking rewards pool is 13.2 billion CRE tokens, so mint that quantity to be held
in the staking contract:

    // e.g. Staking contract deployed to 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
    hh mint --account 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 --amount 13200000000

#### Step 4 - Mint some tokens to other EOA accounts

For use in testing staking etc.

    hh mint --account <HARDHAT_ACCOUNT_ADDRESS> --amount <QUANTITY>

# Hardhat Tasks

Some tasks target the `Crescite` contract, others target the `Staking` contract.

## Verifying Contracts

There are a number of bugs that remain in the XDC Explorer when dealing with contracts that use base libraries like Open
Zeppelin.

## A note about task execution

When executing a task, if you want to target the xinfin network or Apothem, you will need to set the network in
your `GLOBAL OPTIONS` section:

```
--network xinfin
```

All tasks run against the Hardhat network by default.

## Compilation

The [`hardhat-abi-exporter`](https://github.com/ItsNickBarry/hardhat-abi-exporter#readme) plugin is installed which will
result in ABI files being output to `./abi`. These files are not ignored but published so they can be consumed by
other repos requiring the contract ABI files.

```bash
hh compile
```

## Export ABI only

Export ABI files from existing compilation artifacts.

    hh export-abi

## Staking

### Deploy

    hh [GLOBAL OPTIONS] staking:deploy

### Emergency

> This command requires the staking contract to be paused:
> `hh staking:pause`

This task will withdraw all CRE from the staking contract to a specified address.

    hh [GLOBAL OPTIONS] staking:emergency --network NETWORK

Follow the CLI prompts to specify the address.

> Note - This task will likely be deprecated in favour of a multisig approach

### Pause

When the contract is paused, no staking/unstaking/claiming will be allowed

    hh [GLOBAL OPTIONS] staking:pause

### Resume

Will unpause the staking contract and allow all functionality as usual:

    hh [GLOBAL OPTIONS] staking:unpause

## Crescite

    hh [GLOBAL OPTIONS] crescite:deploy

> **Please Note!**
>
> The Hardhat configuration uses environment variables to reference the deployed Crescite contract
> according to the network specified in `[GLOBAL OPTIONS]`.
>
> See [Environment](#environment).

#### Print Config

```
Usage: hh [GLOBAL OPTIONS] print-config

print-config: Prints the config
```

### Total Supply

```
Usage: hh [GLOBAL OPTIONS] total-supply

total-supply: Prints out the total supply of the token
```

### Balance

```
Usage: hardhat [GLOBAL OPTIONS] balance --account <STRING>

OPTIONS:

  --account     the address of the account

balance: Get balance of account
```

### Mint

```
Usage: hh [GLOBAL OPTIONS] mint --account <STRING> --amount <STRING>

OPTIONS:

  --account     the address of the account
  --amount      the amount of tokens being minted to the address

mint: Mint tokens
```

### Burn

```
Usage: hardhat [GLOBAL OPTIONS] burn --amount <STRING>

OPTIONS:

  --amount      the amount of tokens in the issuing account that will be burnt

burn: Burn tokens in the issuing account
```

### Has Role

```
Usage: hh [GLOBAL OPTIONS] has-role --account <STRING> --role <STRING>

OPTIONS:

  --account     XDC account
  --role        one of the supported roles: DEFAULT_ADMIN_ROLE, SNAPSHOT_ROLE, PAUSER_ROLE, MINTER_ROLE

has-role: Determine if an acount has a role
```

### Grant Role

```
Usage: hh [GLOBAL OPTIONS] grant-role --account <STRING> --role <STRING>

OPTIONS:

  --account     XDC account
  --role        one of the supported roles: DEFAULT_ADMIN_ROLE, SNAPSHOT_ROLE, PAUSER_ROLE, MINTER_ROLE

grant-role: Add an account to a role
```

### Revoke Role

```
Usage: hh [GLOBAL OPTIONS] revoke-role --account <STRING> --role <STRING>

OPTIONS:

  --account     XDC account
  --role        one of the supported roles: DEFAULT_ADMIN_ROLE, SNAPSHOT_ROLE, PAUSER_ROLE, MINTER_ROLE

revoke-role: Remove an account from a role
```
