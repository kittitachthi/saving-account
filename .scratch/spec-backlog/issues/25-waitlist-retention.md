# 25: ล้าง Waitlist ที่ครบอายุ 180 วัน

**What to build:** คำขอที่ยังไม่ได้รับอนุมัติถูกลบเมื่อครบ retention ที่แจ้งไว้

**Blocked by:** None (can start immediately).

**Status:** complete

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [x] ลบเฉพาะ PENDING/DECLINED ครบ 180 วัน ไม่กระทบ APPROVED/Allowlist
- [x] งาน retry ได้และแข่งกับ approval อย่างปลอดภัย
- [x] ทดสอบก่อน/ตรง/หลังขอบอายุและอธิบายวิธีรันงาน
