
![Crescite Logo](./img/Crescite%20logo_transparent%20GOLD%20BROWN_cropped.png)
# Crescite Token

This is the repository for the [Crescite](https://crescite.org/) Token.

# Design 

The Crescite token uses industry standard, audited base contracts from [Open Zeppelin](https://www.openzeppelin.com/). The token contract supports the following set of base interfaces: 

* [Role-based](https://docs.openzeppelin.com/contracts/4.x/access-control#granting-and-revoking) [AccessControl](https://docs.openzeppelin.com/contracts/4.x/api/access)
* [ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20)
* [Mintable](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_mint-address-uint256-)
* [Burnable](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_burn-address-uint256-)
* [Pausable](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Pausable)
* [Snapshot](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Snapshot)
* [Permit](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Permit)
* [Flash Minting](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20FlashMint)

# License

Crescite is published under the [Apache v2.0](./LICENSE.md) license. 

## Local Dev Setup

In the local directory of this project setup `.env` file with the following content:

```
XINFIN_NETWORK_URL=[Either https://erpc.apothem.network or https://erpc.xinfin.network]
XINFIN_PRIVATE_KEY=[the private key for deploying to the XDC network]
```

Then run the following to install all dependencies.

```
npm install
```

Install the Hardhat shortcut:

```
npm install --global hardhat-shorthand
```

Set the `TOKEN_CONTRACT` environment variable either in the `.env` file:

```.env
TOKENB_CONTRACT=[token contract address]
```

or within your shell / CLI:

```
export TOKEN_CONTRQACT=[token contract address]
```

## Hardhat Tasks

## A note about task execution

When executing a task, if you want to target the xinfin network, Apothem or mainnet, you will need to set the network in your `GLOBAL OPTIONS` section:

```
--network xinfin
```

### Compilation

```bash
hh compile
```

### Deployment

```
hh [GLOBAL OPTIONS] deploy
```

> **Please Note!**
>
> The Hardhat configuration uses the environment variable `TOKEN_CONTRACT` to reference the deployed Crescite contract.
>
> You can either set this with
>
> ```
> export TOKEN_CONTRACT=[token contract address]
> ```
> 
> Or as part of the deployment (e.g. when working with the Apothem test network)
>
> ```
> export TOKEN_CONTRACT=$(hh --network xinfin deploy)
> ```
>

### Verifying Contracts

There are a number of bugs that remain in the XDC Explorer when dealing with contracts that use base libraries like Open Zeppelin. 
### Print Config 

```
Usage: hh [GLOBAL OPTIONS] print-config

print-config: Prints the config
```

### Total Supply 

```
Usage: hh [GLOBAL OPTIONS] total-supply

total-supply: Prints out the total supply of the token
```

### Mint

```
Usage: hh [GLOBAL OPTIONS] mint --account <STRING> --amount <STRING>

OPTIONS:

  --account     the address of the account in 0x... form 
  --amount      the amount of tokens being minted to the address 

mint: Mint tokens
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


