# 03: เพิ่มการยืนยัน Current-Session Logout

**What to build:** ให้ผู้ใช้เลือกออกจากระบบจาก Account Menu แล้วยืนยันก่อนเพิกถอนเฉพาะ Session ของอุปกรณ์ปัจจุบัน เมื่อสำเร็จให้กลับหน้า Login และเห็นข้อความ “ออกจากระบบแล้ว”

**Blocked by:** 02: เพิ่ม Account Menu ที่ responsive และเข้าถึงได้.

**Status:** ready-for-agent

- [ ] Logout เปิด modal confirmation ที่มี “ยกเลิก” และ “ออกจากระบบ” โดย focus เริ่มที่การยกเลิก
- [ ] ก่อน submit ผู้ใช้ยกเลิกด้วยปุ่ม, backdrop หรือ `Escape` ได้และ focus กลับอย่างเหมาะสม
- [ ] การยืนยันเรียก backend logout และเพิกถอนเฉพาะ Current Session พร้อมลบ cookie
- [ ] เมื่อสำเร็จ protected UI หายไป หน้า Login แสดง “ออกจากระบบแล้ว” และ Session อุปกรณ์อื่นยังใช้ได้
