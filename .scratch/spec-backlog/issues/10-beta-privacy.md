# 10: บังคับยอมรับ Beta Privacy Notice

**What to build:** ให้ผู้ใช้ยอมรับประกาศเวอร์ชันปัจจุบันก่อนเข้าข้อมูลการเงิน

**Blocked by:** 07: ป้องกัน CSRF สำหรับ authenticated mutations.

**Status:** ready-for-agent

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [ ] บันทึก user/version/time ที่ backend และป้องกันการข้าม gate
- [ ] สาระสำคัญเปลี่ยนต้องยอมรับใหม่
- [ ] ปฏิเสธแล้วยังเข้าคำอธิบาย/Logout ได้; เชื่อม Account Deletion เมื่อ ticket 23 พร้อม
