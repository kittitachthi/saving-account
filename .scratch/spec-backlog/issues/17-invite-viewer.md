# 17: เชิญ Viewer และเปิด Wallet แบบอ่านอย่างเดียว

**What to build:** Owner เชิญผู้ใช้ Google Account ที่ระบุและผู้รับยืนยันก่อนเปิด Wallet ล่าสุดแบบอ่านอย่างเดียว

**Blocked by:** 12: จัดการเงินเก็บและ Savings Goal ออนไลน์; 13: แก้ไข Transaction ออนไลน์; 14: ลบและ Undo Transaction ออนไลน์; 16: Owner export ข้อมูล Wallet.

**Status:** ready-for-agent

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [ ] คำเตือนก่อนแชร์, normalized verified email, random token เก็บ hash ใช้ครั้งเดียวหมดอายุ 7 วัน และอีเมลเชิญที่ retry ได้
- [ ] แยก Personal/Shared Wallet แสดง Owner และ updatedAt ของ Transaction
- [ ] ซ่อน mutation/export controls และ backend ปฏิเสธ Viewer ทุก write/export route
- [ ] ทดสอบ token replay/concurrency/wrong recipient และแสดงข้อมูลล่าสุดหลัง Owner เปลี่ยน
