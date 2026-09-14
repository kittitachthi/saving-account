# 24: ลบบัญชีถาวรเมื่อครบกำหนด

**What to build:** งานเบื้องหลังลบข้อมูลบัญชีและข้อมูลที่เป็นเจ้าของเมื่อพ้นช่วงกู้คืน

**Blocked by:** 23: ขอลบบัญชีและกู้คืนภายใน 30 วัน.

**Status:** complete

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [x] ลบ owned Wallets/การเงิน/Sessions/Memberships/Invitations ครบถ้วน
- [x] durable job retry/idempotent และตรวจ Pending Deletion อีกครั้งก่อนลบ
- [x] ไม่ลบบัญชีที่กู้คืนทันกำหนด; มี verification โดยไม่ log ข้อมูลอ่อนไหว
