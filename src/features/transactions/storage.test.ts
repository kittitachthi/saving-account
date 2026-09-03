import { describe,expect,it } from 'vitest'
import { loadTransactions,saveTransactions,TRANSACTIONS_KEY } from './storage'
import type { Transaction } from './domain'
const fallback:Transaction[]=[{id:1,title:'ตัวอย่าง',category:'รายรับ',date:'',amount:1,type:'income',icon:'฿'}]
const storage=()=>{const values=new Map<string,string>();return{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)},removeItem:(key:string)=>values.delete(key),clear:()=>values.clear(),key:()=>null,get length(){return values.size}} satisfies Storage}
describe('transaction storage adapter',()=>{
 it('fallback เมื่อ JSON ใช้ไม่ได้',()=>{const memory=storage();memory.setItem(TRANSACTIONS_KEY,'{');expect(loadTransactions(fallback,memory)).toBe(fallback)})
 it('บันทึกและโหลดเฉพาะ Transaction ที่ถูกต้อง',()=>{const memory=storage();saveTransactions(fallback,memory);expect(loadTransactions([],memory)).toEqual(fallback)})
})
