/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-refresh/only-export-components */

import { useMutation } from '@tanstack/react-query'
import { FaCheck, FaSpinner } from 'react-icons/fa6'
import { toast as tos } from 'sonner'
import { twMerge } from 'tailwind-merge'
import type { Account, Address, Chain, Hex, PublicClient, RpcSchema, SimulateContractParameters, WalletClient } from 'viem'
import { encodeFunctionData, erc20Abi, zeroAddress } from 'viem'
import { type Transport, useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi'
import { create } from 'zustand'
import { Button } from './btn'
import { cn, getErrorMsg, handleError, promiseT } from './utils'
import { ConnectButton } from '@rainbow-me/rainbowkit'
// import { SimpleDialog } from './simple-dialog'

export function SwitchNet({ className, requireChainId }: { className?: string, requireChainId: number }) {
  const sc = useSwitchChain()
  return <Button
    className={twMerge('flex items-center justify-center gap-4 whitespace-nowrap w-fit min-w-[200px]', className)}
    onClick={() => sc.switchChainAsync({ chainId: requireChainId }).catch(console.error)}
    loading={sc.isPending}
    disabled={sc.isPending}>
    Switch Network
  </Button>
}


export type TxConfig = SimulateContractParameters & { name?: string }
export type TX = TxConfig | (() => Promise<TxConfig>)
export const useTxsStore = create(() => ({ txs: [] as TxConfig[], progress: 0 }))
// const supportedSendCalls: number[] = isPROD ? [] : [mainnet.id, optimism.id, bsc.id, polygon.id, base.id, arbitrum.id, berachain.id, sepolia.id]
const supportedSendCalls: number[] = []

export type TXSType = TX[] | ((args: { pc: PublicClient, wc: WalletClient<Transport, Chain, Account, RpcSchema> }) => Promise<TX[]> | TX[])
export function Txs({
  className, tx, txs, disabled, disableProgress, beforeSimulate, toast = true, chainId, onTxSuccess, beforeTxSuccess }:
  {
    disableProgress?: boolean,
    beforeSimulate?: boolean,
    className?: string, tx: string, disabled?: boolean, txs: TXSType, toast?: boolean
    chainId: number,
    onTxSuccess?: () => void
    beforeTxSuccess?: (hashs: Hex[]) => Promise<void>
  }) {
  const { data: wc } = useWalletClient()
  const { address, chainId: currentChainId } = useAccount()
  const pc = usePublicClient({ chainId })
  const txDisabled = disabled || (typeof txs !== 'function' && txs.length == 0) || !wc || !pc
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (txDisabled || isPending) return
      const calls = await promiseT(txs, { pc, wc }).then(items => Promise.all(items.map(promiseT)))
      console.info('calls:', wc.name, wc.account.address, calls)
      try {
        if (calls.length == 1 || !supportedSendCalls.includes(chainId)) {
          throw new Error('unuse wallet_sendCalls')
        }
        const callsTxs = calls.map(item => ({ data: encodeFunctionData({ abi: item.abi, functionName: item.functionName, args: item.args }), to: item.address }));

        const { id } = await wc.sendCalls({
          account: wc.account.address,
          calls: callsTxs,
          forceAtomic: true,
        })
        const res = await wc.waitForCallsStatus({ id, throwOnFailure: true, retryCount: Infinity })
        if (res.status == 'success') {
          await beforeTxSuccess?.((res.receipts ?? []).map(r => r.transactionHash))
          toast && tos.success("Transactions Success")
          onTxSuccess?.()
        }
      } catch (error) {
        const msg = getErrorMsg(error)
        const showTxsStat = !disableProgress && calls.length > 1
        if (msg && (msg.includes('wallet_sendCalls') || msg.includes("not supported") || msg.includes("Not supported"))) {
          let progress = 0;
          showTxsStat && useTxsStore.setState({ txs: calls, progress })
          const callHashes: Hex[] = []
          for (const item of calls) {
            const txconfig = beforeSimulate ? (await pc.simulateContract(item)).request : item;
            const tx = await wc.writeContract(txconfig)
            callHashes.push(tx)
            const res = await pc.waitForTransactionReceipt({ hash: tx, confirmations: 1 })
            if (res.status !== 'success') throw new Error('Transactions Reverted')
            if (callHashes.length == calls.length) {
              await beforeTxSuccess?.(callHashes)
            }
            progress++
            showTxsStat && useTxsStore.setState({ progress })
          }
          toast && tos.success("Transactions Success")
          useTxsStore.setState({ progress: 0, txs: [] })
          onTxSuccess?.()
        } else {
          throw error
        }
      }
    },
    onError: (error) => {
      useTxsStore.setState({ progress: 0, txs: [] })
      toast && handleError(error)
    }
  })

  if (!address || !currentChainId) {
    return <ConnectButton />
  }
  if (chainId !== currentChainId) {
    return <SwitchNet className={className} requireChainId={chainId} />
  }
  return <Button className={twMerge('flex items-center justify-center gap-4', className)} onClick={() => mutate()} loading={isPending} disabled={txDisabled || isPending}>
    {tx}
  </Button>
}

export async function withTokenApprove({ approves, pc, user, tx }: {
  approves: { spender: Address, token: Address, amount: bigint, name?: string }[],
  pc: PublicClient
  user: Address,
  tx: TxConfig
}) {
  let nativeAmount = 0n;
  const needApproves = await Promise.all(approves.map(async item => {
    if (zeroAddress === item.token) {
      nativeAmount += item.amount;
      return null
    }
    const allowance = await pc.readContract({ abi: erc20Abi, address: item.token, functionName: 'allowance', args: [user, item.spender] })
    if (allowance >= item.amount) return null
    const name = item.name ?? `Approve Token ${item.token.slice(0, 6)}...${item.token.slice(item.token.length - 4)}`
    return { name, abi: erc20Abi, address: item.token, functionName: 'approve', args: [item.spender, item.amount] } as TxConfig
  })).then(txs => txs.filter(item => item !== null))
  return [...needApproves, { ...tx, ...(nativeAmount > 0n ? { value: nativeAmount } : {}) }]
}

export function TxsStat({ className }: { className?: string }) {
  const { txs, progress } = useTxsStore()
  if (txs.length == 0) return null
  return <div className={cn('w-80 text-stone-50 flex flex-col gap-2 p-4 fixed top-25 right-5 bg-stone-900 rounded-2xl shadow-2xl border border-stone-700/50 z-50', className)}>
    <div className='text-xl font-semibold'>Progress </div>
    <div className='flex flex-col gap-2 max-h-80 overflow-y-auto px-2.5'>
      {txs.map((tx, i) => <div key={`tx_item_stat_${i}`} className={cn('animitem flex items-center gap-5 bg-primary/20 px-4 py-2', { 'border-t border-white/20': i > 0 })}>
        <span className='font-semibold'>{i + 1}</span>
        <span className='first-letter:uppercase'>
          {tx.name ?? tx.functionName}
        </span>
        <div className={cn('ml-auto text-xl', { 'animate-spin': progress == i })}>
          {progress == i && <FaSpinner />}
          {progress > i && <FaCheck className='text-green-500' />}
        </div>
      </div>)}
    </div>
    {/* <div className='opacity-80 text-center'>Will require multiple signatures, this will be simplified into 1 approval with future updates!</div> */}
  </div>
}

