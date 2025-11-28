import { erc20Abi, isAddress, type Address } from "viem";
import type { Token } from "./configs";
import { useAccount, useReadContract } from "wagmi";

export function useBalance(token?: Token, user?: Address) {
  const { address } = useAccount();
  const mUser = user ?? address;
  return useReadContract({
    abi: erc20Abi,
    address: token?.address,
    functionName: "balanceOf",
    args: [mUser!],
    chainId: token?.chain,
    query: {
      enabled: Boolean(mUser) && isAddress(mUser!) && Boolean(token),
      refetchOnMount: "always",
      staleTime: 1000,
    },
  });
}
