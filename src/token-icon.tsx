/* eslint-disable @typescript-eslint/no-explicit-any */
import { getChain, type Token } from "./configs";
import { cn } from "./utils";
import IDOL from '/IDOL.png?url';

const SymbolIcon: Record<string, string> = {
    IDOL
}
export function TokenIcon({ token, showNet = false, className }: { token: Token; className?: string; showNet?: boolean }) {
    const chain = getChain(token.chain)
    return <div className={cn('relative text-[1.625rem]', className)}>
        <img src={SymbolIcon[token.symbol]} className="w-[1em] h-[1em] aspect-square rounded-full overflow-hidden" />
        {
            showNet && chain && <img src={(chain as unknown as any).iconUrl} className='absolute right-0 bottom-0 w-1/3 h-1/3 rounded-full' />
        }
    </div>
}