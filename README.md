
![Crescite Logo](./img/Crescite%20logo_transparent%20GOLD%20BROWN_cropped.png)
# Crescite Token

This is the repository for the [Crescite](https://crescite.org/) Token.

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

or within your shell:

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

### Print Config 

```
Usage: hardhat [GLOBAL OPTIONS] print-config

print-config: Prints the config
```

### Total Supply 

```
Usage: hardhat [GLOBAL OPTIONS] total-supply

total-supply: Prints out the total supply of the token
```


### Has Role

```
Usage: hardhat [GLOBAL OPTIONS] has-role --account <STRING> --role <STRING>

OPTIONS:

  --account     XDC account  
  --role        one of the supported roles: DEFAULT_ADMIN_ROLE, SNAPSHOT_ROLE, PAUSER_ROLE, MINTER_ROLE 

has-role: Determine if an acount has a role
```

### Mint

```
Usage: hardhat [GLOBAL OPTIONS] mint --account <STRING> --amount <STRING>

OPTIONS:

  --account     the address of the account in 0x... form 
  --amount      the amount of tokens being minted to the address 

mint: Mint tokens
```

