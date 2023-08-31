export function ethAddressToXdc(address: string): string {
  if (address.startsWith('xdc')) {
    return address;
  }
  if (address.startsWith('0x')) {
    return 'xdc' + address.slice(2);
  }
  throw new Error(`unknown address type: ${address}`);
}
