import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';

export function toKeccak256(value: string) {
  return keccak256(toUtf8Bytes(value));
}
