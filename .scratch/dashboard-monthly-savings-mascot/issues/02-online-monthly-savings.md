# 02: เพิ่ม Monthly Savings ให้ Online Wallet

**What to build:** ผู้ใช้ Online Wallet เห็นเงินเก็บเดือนนี้จากข้อมูล persisted โดยยอดไม่เปลี่ยนตาม filter หรือ pagination

**Blocked by:** 01: เพิ่ม Monthly Savings และจัด Dashboard ใหม่สำหรับ Local Wallet.

**Status:** complete

- [x] Wallet monthly summary มี Income, Expense และ Savings ตามขอบเขต Asia/Bangkok
- [x] API contract, presentation และ fixtures รองรับข้อมูลใหม่โดยไม่เปลี่ยน HTTP/database contract
- [x] รอยต่อเดือน precision และ independence จากรายการหน้าปัจจุบันมี test
