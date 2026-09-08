# 11: บันทึกและอ่านรายรับ/รายจ่ายจาก Personal Wallet ออนไลน์

**What to build:** เพิ่มรายรับ/รายจ่ายแล้วเห็นข้อมูลเดียวกันข้ามอุปกรณ์โดยแยกแต่ละบัญชี

**Blocked by:** 07: ป้องกัน CSRF สำหรับ authenticated mutations; 10: บังคับยอมรับ Beta Privacy Notice.

**Status:** complete

**Scheduling:** User selected tickets 10–12; completed on 2026-09-08.

- [x] เก็บ integer satang, occurredOn, optional occurredTime, createdAt/updatedAt และ Wallet Timezone Asia/Bangkok
- [x] UI/API ตรวจ Owner Membership และไม่แสดงข้อมูลต่าง Wallet; validation ยอดทำแบบ atomic
- [x] รายการและรายงานอ่าน server source of truth พร้อม deterministic sorting/filter/pagination และ monthly/day rollover
- [x] ไม่มี automatic local-data upload; เก็บข้อมูลเดิมไว้เพื่อ import และไม่เปิดฟังก์ชันที่ยังเขียน local โดยปะปนกับ Wallet ออนไลน์
