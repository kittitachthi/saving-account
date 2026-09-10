# 19: เพิกถอน Viewer และออกจาก Wallet ที่แชร์

**What to build:** Owner ดู Viewers/revoke และ Viewer ยืนยัน leave ได้

**Blocked by:** 17: เชิญ Viewer และเปิด Wallet แบบอ่านอย่างเดียว.

**Status:** complete

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [x] Owner เห็นรายชื่อผู้มีสิทธิ์จริง
- [x] request หลัง revoke/leave ถูกปฏิเสธและ UI ไม่ค้างแสดงข้อมูลที่ถูกถอนสิทธิ์
- [x] Viewer leave ใช้หนึ่ง confirmation; ป้องกันผู้ไม่มีสิทธิ์จัดการ Membership
