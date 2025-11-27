/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { parseUnits } from "viem";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMsg(error: any) {
  // msg
  let msg = "Unkown";
  if (typeof error == "string") msg = error;
  else if (typeof error?.msg == "string") msg = error?.msg;
  else if (typeof error?.message == "string") msg = error?.message;
  // replace
  if (msg.includes("User denied") || msg.includes("user rejected transaction"))
    return "You declined the action in your wallet.";
  if (msg.includes("transaction failed")) return "Transaction failed";
  return msg;
}

export function handleError(error: any) {
  toast.error(getErrorMsg(error));
}

type NonFunction<T> = T extends () => any ? never : T;

export async function promiseT<T>(
  promiseOrData:
    | NonFunction<T>
    | ((...args: any[]) => Promise<NonFunction<T>> | NonFunction<T>),
  ...args: any[]
) {
  if (typeof promiseOrData !== "function") return promiseOrData;
  return (
    promiseOrData as (
      ...args: any[]
    ) => Promise<NonFunction<T>> | NonFunction<T>
  )(...args);
}

export function tryParseUnits(value: string, decimals: number) {
  try {
    return parseUnits(value, decimals);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return 0n;
  }
}

export function isNil(v: any) {
  return v === null || v === undefined;
}
