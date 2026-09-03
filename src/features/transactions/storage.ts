import { isTransaction } from './domain'
import type { Transaction } from './domain'

export const TRANSACTIONS_KEY='daily-money-transactions-v1'
export const loadTransactions=(fallback:Transaction[],storage:Storage=localStorage):Transaction[]=>{try{const saved=storage.getItem(TRANSACTIONS_KEY);if(!saved)return fallback;const parsed:unknown=JSON.parse(saved);return Array.isArray(parsed)?parsed.filter(isTransaction):fallback}catch{return fallback}}
export const saveTransactions=(items:Transaction[],storage:Storage=localStorage)=>storage.setItem(TRANSACTIONS_KEY,JSON.stringify(items))
