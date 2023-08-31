export function xdcAddressToEth(address: string): string {
  if (address.startsWith('0x')) {
    return address;
  }
  if (address.startsWith('xdc')) {
    return '0x' + address.slice(3);
  }
  throw new Error(`unknown address type ${address}`);
}
