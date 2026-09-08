# 10: บังคับยอมรับ Beta Privacy Notice

**What to build:** ให้ผู้ใช้ยอมรับประกาศเวอร์ชันปัจจุบันก่อนเข้าข้อมูลการเงิน

**Blocked by:** 07: ป้องกัน CSRF สำหรับ authenticated mutations.

**Status:** complete

**Scheduling:** User selected tickets 10–12; completed on 2026-09-08.

- [x] บันทึก user/version/time ที่ backend และป้องกันการข้าม gate
- [x] สาระสำคัญเปลี่ยนต้องยอมรับใหม่
- [x] ปฏิเสธแล้วยังเข้าคำอธิบาย/Logout ได้; เชื่อม Account Deletion เมื่อ ticket 23 พร้อม
