/* eslint-disable @typescript-eslint/no-explicit-any */
import { abiLayerzeroOFT } from "./abiLayerzero";
import { SupportChains, type Token } from "./configs";
import { waitLayerZeroSend } from "./layerzero";

import { Options } from '@layerzerolabs/lz-v2-utilities';
import { useState } from "react";
import { FaSpinner } from "react-icons/fa6";
import { type Address, type Chain, formatUnits, type Hex, isAddress, padHex, zeroAddress } from "viem";
import { bsc, mainnet } from "viem/chains";
import { useAccount, useReadContract } from "wagmi";
import { TokenInput } from "./token-input";
import { Txs, withTokenApprove } from "./txs";
import { isNil, tryParseUnits } from "./utils";
import { useBalance } from "./hooks";

// layerzero  eid(Endpoint ID) by chainId @link https://docs.layerzero.network/v2/deployments/deployed-contracts?chains=checking-default-configs%2Cbsc%2Cethereum
const eidMaps: { [k: number]: number } = {
    [mainnet.id]: 30101,
    [bsc.id]: 30102,
}
//  config chainId:token -> LayerZeroAdapter
const defAdapters: {
    [k: `${number}:${Address}`]: Address
} = {
    [`${bsc.id}:0x3B4de3c7855C03bB9F50ea252cD2c9FA1125Ab07`]: '0xB5980fD3eaD26d07993B683218256A780060B1db',
} as const

// layerzero options
const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString() as Hex

export function BridgeToken({ config, adapters }: {
    config: [Token, Token], adapters?: typeof defAdapters
}) {
    const { address: user } = useAccount()
    const [t0, t1] = config
    const [[from, to], setFromTo] = useState<[Token, Token]>([t0, t1])
    const fromChain = SupportChains.find(c => c.id === from.chain)!
    const toChain = SupportChains.find(c => c.id === to.chain)!
    const toggleFromTo = () => setFromTo([to, from])
    const [input, setInput] = useState<string>("")
    const [toAddress, setToAddress] = useState<string>("")
    const toUser = toAddress || (user ?? '')
    const inputBn = tryParseUnits(input ?? '0', from.decimals)
    const mAdapters = adapters ?? defAdapters
    const address = mAdapters[`${from.chain}:${from.address.toLowerCase() as Address}`] ?? from.address
    const invalidToUser = isAddress(toUser)
    const balance = useBalance(from)
    const invalidInput = inputBn > 0n && inputBn <= (balance.data ?? 0n)
    const readFee = useReadContract({
        abi: abiLayerzeroOFT,
        address,
        functionName: 'quoteSend',
        args: [
            {
                dstEid: eidMaps[to.chain],
                to: invalidToUser ? padHex(toUser, { size: 32 }) : zeroAddress,
                amountLD: inputBn,
                minAmountLD: inputBn,
                extraOptions: options,
                composeMsg: '0x',
                oftCmd: '0x'
            }, false
        ],
        chainId: from.chain,
        query: { enabled: invalidToUser && invalidInput }
    })

    const disableBridge = !invalidToUser || !invalidInput || readFee.isFetching
    const getTxs: Parameters<typeof Txs>['0']['txs'] = async ({ pc, wc }) => {
        if (!readFee.data || readFee.isFetching) return []
        const fee = readFee.data;
        return withTokenApprove({
            pc, user: wc.account.address,
            approves: [
                { spender: address, token: from.address, amount: inputBn }
            ],
            tx: {
                abi: abiLayerzeroOFT,
                address,
                functionName: 'send',
                args: [{
                    dstEid: eidMaps[to.chain],
                    to: padHex(toUser as Address, { size: 32 }),
                    amountLD: inputBn,
                    minAmountLD: inputBn,
                    extraOptions: options,
                    composeMsg: '0x',
                    oftCmd: '0x'
                }, fee, wc.account.address],
                value: fee.nativeFee
            }
        })
    }
    const renderChain = (chain: Chain, label: string) => {
        return <div className="flex flex-col gap-3 relative p-4 rounded-xl bg-[#211B6D] border border-[#3C2E94]">
            <div className="opacity-60">{label}</div>
            <div className="flex items-center gap-3">
                <img src={(chain as any).iconUrl} className="w-6.5 h-6.5 rounded-full" />
                <div className="font-medium whitespace-nowrap">{chain.name}</div>
            </div>
        </div>
    }
    return <div style={{
        background: 'linear-gradient(141.1deg, #312E97 2.57%, #15135D 17.85%, #15135D 78.52%, #312E97 100%)'
    }} className="flex flex-col gap-4 p-2.5 md:p-4 w-full max-w-xl my-auto text-white rounded-2xl border border-[#584DDE]/60">
        <div className="text-center ">Bridge</div>
        <div className="animitem flex flex-col gap-2 relative">
            {renderChain(fromChain, 'From')}
            {renderChain(toChain, 'To')}
            <div className="flex items-center justify-center cursor-pointer bg-[#2D237E] border border-[#3C2E94] w-9 h-9 rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" onClick={toggleFromTo}>
                <svg width="17" height="19" viewBox="0 0 17 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.9519 11.7552L10.5519 17.9165C10.3644 18.119 10.0149 17.9915 10.0149 17.72V2.25948V0.757226C10.0149 0.658734 10.0343 0.561207 10.072 0.470213C10.1097 0.379219 10.1649 0.29654 10.2346 0.226896C10.3042 0.157252 10.3869 0.102007 10.4779 0.064316C10.5689 0.0266249 10.6664 0.00722579 10.7649 0.00722579H11.5149C11.6134 0.00722579 11.7109 0.0266249 11.8019 0.064316C11.8929 0.102007 11.9756 0.157252 12.0452 0.226896C12.1149 0.29654 12.1701 0.379219 12.2078 0.470213C12.2455 0.561207 12.2649 0.658734 12.2649 0.757226V2.25723C12.2649 2.28723 12.2514 2.31273 12.2476 2.34198V11.2647H15.7224C15.9871 11.2647 16.1281 11.5647 15.9519 11.7552ZM5.26489 18.0072H4.51489C4.4164 18.0072 4.31887 17.9878 4.22788 17.9501C4.13689 17.9124 4.05421 17.8572 3.98456 17.7876C3.91492 17.7179 3.85967 17.6352 3.82198 17.5442C3.78429 17.4532 3.76489 17.3557 3.76489 17.2572V15.7572C3.76489 15.7272 3.77839 15.7017 3.78214 15.6725V6.75123H0.307392C0.0426421 6.75123 -0.0976078 6.45048 0.0778922 6.26073L5.47789 0.0994757C5.66539 -0.103024 6.01489 0.0244756 6.01489 0.294476V17.2572C6.01489 17.3557 5.99549 17.4532 5.9578 17.5442C5.92011 17.6352 5.86487 17.7179 5.79522 17.7876C5.72558 17.8572 5.6429 17.9124 5.5519 17.9501C5.46091 17.9878 5.36338 18.0072 5.26489 18.0072Z" fill="white" />
                </svg>
            </div>
        </div>
        <div className="animitem">Token</div>
        <TokenInput className="animitem" token={from} amount={input} setAmount={setInput} />
        <div className="animitem">To</div>
        <input value={toUser} onChange={(e) => setToAddress(e.target.value)} type="text" className="w-full h-12 px-4 text-lg bg-[#211B6D] border border-[#3C2E94] focus:border-2 rounded-xl outline-none text-slate-50" />
        <div className="flex gap-2 justify-end items-center opacity-60">
            {readFee.isFetching && <FaSpinner className="animate-spin" />}
            Fee: {isNil(readFee.data) ? '-' : formatUnits(readFee.data?.nativeFee ?? 0n, fromChain.nativeCurrency.decimals)} {fromChain.nativeCurrency.symbol}</div>
        <div className="animitem w-full flex justify-center">
            <Txs
                tx="Bridge"
                chainId={from.chain}
                beforeTxSuccess={(hashs) => waitLayerZeroSend(from.chain, hashs[hashs.length - 1])}
                onTxSuccess={() => setInput('')}
                disabled={disableBridge}
                className="w-full"
                txs={getTxs}
            />
        </div>
    </div>

}