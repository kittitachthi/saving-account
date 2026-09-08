# 08: ต่ออายุ Session ตามการใช้งาน

**What to build:** รักษา Session ระหว่างใช้งานและหมดอายุหลังไม่ใช้งาน 7 วัน

**Blocked by:** None (can start immediately).

**Status:** complete

**Scheduling:** Completed on 2026-09-08 following the user's instruction to continue.

- [x] วันหมดอายุฝั่ง server และ cookie สอดคล้องกัน
- [x] Session ถูก revoke/หมดอายุแล้วไม่ฟื้นจาก renewal
- [x] ทดสอบขอบเวลาและ concurrent renewal ผ่าน HTTP/persistence
