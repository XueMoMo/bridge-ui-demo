import type { Hex } from 'viem'
import { getChain } from './configs'

export async function waitLayerZeroSend(chainId: number, txHash: Hex, maxAttempts = 20, intervalMs = [30000, 5000]) {
  const chain = getChain(chainId)
  if (!chain) {
    throw new Error(`Unsupported chainId: ${chainId}`)
  }
  const baseApi = chain.testnet ? 'https://scan-testnet.layerzero-api.com/v1' : 'https://scan.layerzero-api.com/v1'
  let attempts = 0

  while (attempts < maxAttempts) {
    const waittime = intervalMs[attempts] ?? intervalMs[intervalMs.length - 1]
    await new Promise((resolve) => setTimeout(resolve, waittime))
    try {
      const response = await fetch(`${baseApi}/messages/tx/${txHash}`)
      const data = (await response.json())?.data?.[0]
      const status = data?.status
      if (status && (status.name === 'DELIVERED' || status.name === 'COMPLETED')) {
        return
      } else if (status) {
        throw new Error(`${status.name}: ${status.message}`)
      }
      console.log(`Try ${attempts + 1}/${maxAttempts}: Status ${status?.name}`)
    } catch (error) {
      console.error('waitLayerZeroSend:', error)
    }
    attempts++
  }

  throw new Error('Check transaction status timeout')
}
