import { MD5 } from "crypto-js"

export const genID = (): string =>  Math.round(Math.random() * 10000000).toString();
export const getHash = (el: string): string => MD5(el).toString();