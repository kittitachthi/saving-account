# 06: แก้ Logout เมื่อ Session ไม่ถูกต้อง

**What to build:** Logout ที่ไม่มี Session หรือหมดอายุตอบ authentication error แทนผลสำเร็จหลอก

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [ ] ตรวจ Session ก่อนตอบสำเร็จ
- [ ] Session ปกติถูกเพิกถอนเฉพาะอุปกรณ์ปัจจุบันและล้าง cookie
- [ ] ทดสอบ HTTP invalid/missing/expired Session และ frontend failure/retry
