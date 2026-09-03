import { describe, expect, it } from 'vitest'
import { calculateTotals, removeTransaction, restoreTransaction } from './domain'
import type { Transaction } from './domain'

const items:Transaction[]=[{id:1,title:'รายรับ',category:'รายรับ',date:'วันนี้',amount:100,type:'income',icon:'฿'},{id:2,title:'อาหาร',category:'อาหาร',date:'วันนี้',amount:25,type:'expense',icon:'•'}]
describe('transaction domain',()=>{
 it('คำนวณยอดจาก Transaction source of truth',()=>expect(calculateTotals(items)).toEqual({income:100,expense:25,balance:75}))
 it('ลบและคืน Transaction ที่ตำแหน่งเดิมโดยไม่ mutate input',()=>{const result=removeTransaction(items,1);expect(result.transactions.map(x=>x.id)).toEqual([2]);expect(items).toHaveLength(2);expect(restoreTransaction(result.transactions,result.removed!).map(x=>x.id)).toEqual([1,2])})
})
