import type { Address } from "viem";
import { bsc, mainnet } from "viem/chains";
import ethIcon from "/eth.png?url";
import bscIcon from "/bsc.png?url";

export const SupportChains = [
  { ...mainnet, iconUrl: ethIcon },
  { ...bsc, iconUrl: bscIcon },
] as const;

export function getChain(chainId: number) {
  return SupportChains.find((item) => item.id == chainId);
}

export type Token = {
  address: Address;
  chain: number;
  symbol: string;
  decimals: number;
};
export const tokens: Token[] = [
  {
    address: "0x3B4de3c7855C03bB9F50ea252cD2c9FA1125Ab07",
    chain: bsc.id,
    symbol: "IDOL",
    decimals: 18,
  },
  {
    address: "0x8f08776d4D008dD12fD1167Cb572a3eBcd3eb6CA",
    chain: mainnet.id,
    symbol: "IDOL",
    decimals: 18,
  },
];
