/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client'

import { useRef } from 'react'
import { FaSpinner } from 'react-icons/fa6'
import { formatUnits } from 'viem'
import { type Token } from './configs'
import { useBalance } from './hooks'
import { TokenIcon } from './token-icon'
import { cn, isNil, tryParseUnits } from './utils'


function TokenSymbol({ token }: { token: Token, }) {
  return <div className='flex items-center gap-2'>
    <TokenIcon token={token} />
    {token.symbol}
  </div>
}

export function TokenInput({
  className,
  token,
  checkBalance = true,
  balance: showBalance = true,
  balanceTit = 'Balance',
  selected,
  onClick,
  amount,
  setAmount,
  disable,
  balanceClassName = '',
  loading,
  error = '',

}: {
  token: Token,
  checkBalance?: boolean
  balance?: boolean
  balanceTit?: string
  selected?: boolean
  onClick?: () => void
  amount?: string
  setAmount?: (amount: string) => void
  disable?: boolean
  loading?: boolean
  balanceClassName?: string
  error?: string
  className?: string
}) {
  const mShowBalance = showBalance && !disable
  const mCheckBalance = checkBalance && !disable
  const balance = useBalance(mShowBalance ? token : undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const balanceInsufficient = mCheckBalance && tryParseUnits(`${amount ?? '0'}`, token.decimals) > (balance.data ?? 0n)
  const isError = Boolean(error) || balanceInsufficient
  return (
    <div
      className={cn('relative w-full', className)}
      onClick={() => {
        !disable && onClick?.()
      }}
    >
      <div className='relative'>
        <div className='absolute flex items-center gap-2 w-fit top-1/2 left-4 -translate-y-1/2 z-50'>
          <TokenSymbol token={token} />
        </div>
        <input
          value={loading ? '' : amount}
          onChange={(e) => {
            if (disable) return
            const numstr = (e.target.value || '').replaceAll('-', '').replaceAll('+', '').replaceAll(" ", "")
            setAmount?.(numstr)
          }}
          ref={inputRef}
          type='number'
          disabled={disable}
          className={cn(
            'w-full h-12 pl-25 text-right pr-4 font-bold text-lg bg-[#211B6D] border border-[#3C2E94] focus:border-2 rounded-xl outline-none text-slate-50',
            {
              'border-2 border-green-700': selected,
              'border-2 border-red-400 ': isError,
              'opacity-60 cursor-not-allowed': disable
            },
          )}
          placeholder='0.000'
          maxLength={36}
          pattern='[0-9.]{36}'
          step={0.01}
          title=''
          readOnly={disable}
        />
        {loading && <FaSpinner className='absolute animate-spin right-24 top-4.5' />}
        {isError && <div className='text-sm text-white bg-red-400 rounded left-0 bottom-0 absolute px-1 translate-y-1/2'>{error || 'Insufficient account balance'}</div>}
      </div>

      {mShowBalance && (
        <div className='flex items-center justify-end mt-1 px-1 text-slate-50/70 text-sm'>
          <div className={cn('flex gap-2 items-center', balanceClassName)}>
            {balance.isFetching && <FaSpinner className='animate-spin' />}
            <span>
              {balanceTit}: {isNil(balance.data) ? '-' : formatUnits(balance.data ?? 0n, token.decimals)}
            </span>
            {!disable && <button
              className='text-[#F35CAF] cursor-pointer'
              onClick={() => {
                const fmtAmount = formatUnits(balance.data ?? 0n, token.decimals)
                setAmount?.(fmtAmount)
                !disable && onClick?.()
              }}
            >
              Max
            </button>}
          </div>
        </div>
      )}
    </div>
  )
}
