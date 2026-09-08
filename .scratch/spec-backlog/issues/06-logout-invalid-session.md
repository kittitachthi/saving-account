# 06: แก้ Logout เมื่อ Session ไม่ถูกต้อง

**What to build:** Logout ที่ไม่มี Session หรือหมดอายุตอบ authentication error แทนผลสำเร็จหลอก

**Blocked by:** None (can start immediately).

**Status:** complete

**Scheduling:** Completed on 2026-09-08 following the user's instruction to continue.

- [x] ตรวจ Session ก่อนตอบสำเร็จ
- [x] Session ปกติถูกเพิกถอนเฉพาะอุปกรณ์ปัจจุบันและล้าง cookie
- [x] ทดสอบ HTTP invalid/missing/expired Session และ frontend failure/retry
