import {
  ConnectButton,
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { PropsWithChildren } from 'react';
import { WagmiProvider } from 'wagmi';
import { SupportChains, tokens } from './configs';
import { TxsStat } from './txs';
import { BridgeToken } from './bridge-token';
import { Toaster } from 'sonner';

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: SupportChains,
  ssr: false, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

const theme = darkTheme({ accentColor: 'linear-gradient(270deg, #fc78ff 0%, #9a6bfe 100%)', accentColorForeground: 'white', borderRadius: 'large' })

function Providers({ children }: PropsWithChildren) {
  return <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider locale='en' theme={theme} modalSize='wide' coolMode>
        {children}
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
}

function App() {
  return (
    <Providers>
      <div className='w-screen h-screen flex flex-col items-center bg-main p-2.5'>
        <BridgeToken config={[tokens[0], tokens[1]]} />
      </div>
      <div className='flex p-2.5 md:p-4 fixed top-0 right-0'>
        <ConnectButton />
      </div>
      <TxsStat />
      <Toaster position='top-right' offset={{ top: 100, right: 20 }} />
    </Providers>
  )
}

export default App
