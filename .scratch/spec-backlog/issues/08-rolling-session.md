# 08: ต่ออายุ Session ตามการใช้งาน

**What to build:** รักษา Session ระหว่างใช้งานและหมดอายุหลังไม่ใช้งาน 7 วัน

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [ ] วันหมดอายุฝั่ง server และ cookie สอดคล้องกัน
- [ ] Session ถูก revoke/หมดอายุแล้วไม่ฟื้นจาก renewal
- [ ] ทดสอบขอบเวลาและ concurrent renewal ผ่าน HTTP/persistence
